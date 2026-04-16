import { Injectable, inject } from '@angular/core';
import { DomainScore, ExamItemResult, ExamSummary, CCAFDomain } from '../models';
import { ConfigService } from './config.service';

/**
 * Servicio de scoring
 * Maneja el calculo de puntuaciones estandar y ponderadas (CCA-F).
 */
@Injectable({
  providedIn: 'root',
})
export class ScoreService {
  private config = inject(ConfigService);

  /**
   * Pedagogical threshold for identifying weak domains in recommendations.
   * Domains scoring below this percentage are flagged for additional study.
   * This is a pedagogical constant, not a certification parameter.
   */
  private static readonly WEAK_DOMAIN_THRESHOLD = 70;

  /**
   * Calcula un score estandar como porcentaje simple (0-100).
   */
  calculateStandardScore(correct: number, total: number): number {
    if (total <= 0) return 0;
    return Math.round((correct / total) * 100);
  }

  /**
   * Calcula el score ponderado para CCA-F.
   *
   * Cada dominio contribuye: rawPercentage * weight * 1000
   * totalScore = suma de todas las contribuciones
   * passed = totalScore >= ccafPassingScore (from ConfigService)
   */
  calculateCCAFScore(
    items: ExamItemResult[],
    domains: CCAFDomain[],
  ): { totalScore: number; passed: boolean; domainScores: DomainScore[] } {
    const domainScores = this.calculateDomainScores(items, domains);

    const totalScore = domainScores.reduce((sum, ds) => sum + ds.weightedContribution, 0);

    const passed = totalScore >= this.config.ccafPassingScore;

    return { totalScore: Math.round(totalScore), passed, domainScores };
  }

  /**
   * Calcula los scores desglosados por dominio.
   */
  calculateDomainScores(items: ExamItemResult[], domains: CCAFDomain[]): DomainScore[] {
    return domains.map((domain) => {
      const domainItems = items.filter((i) => i.domainCode === domain.code);
      const total = domainItems.length;
      const correct = domainItems.filter((i) => i.isCorrect).length;
      const rawPercentage = total > 0 ? (correct / total) * 100 : 0;
      const weightedContribution = (rawPercentage / 100) * domain.weight * 1000;

      return {
        domainCode: domain.code,
        domainName: domain.name,
        weight: domain.weight,
        correct,
        total,
        rawPercentage: Math.round(rawPercentage * 100) / 100,
        weightedContribution: Math.round(weightedContribution * 100) / 100,
      };
    });
  }

  /**
   * Genera recomendaciones de estudio para dominios debiles
   * (below WEAK_DOMAIN_THRESHOLD% raw score).
   */
  generateRecommendations(domainScores: DomainScore[]): string[] {
    const recommendations: string[] = [];
    const threshold = ScoreService.WEAK_DOMAIN_THRESHOLD;

    const weakDomains = domainScores
      .filter((ds) => ds.rawPercentage < threshold)
      .sort((a, b) => a.rawPercentage - b.rawPercentage);

    for (const ds of weakDomains) {
      recommendations.push(
        `Estudia el dominio "${ds.domainName}" (${ds.domainCode}): obtuviste ${ds.rawPercentage}% de aciertos. ` +
          `Este dominio tiene un peso de ${(ds.weight * 100).toFixed(0)}% en el examen.`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Buen rendimiento en todos los dominios. Mantente al dia revisando las actualizaciones de la plataforma.',
      );
    }

    return recommendations;
  }
}

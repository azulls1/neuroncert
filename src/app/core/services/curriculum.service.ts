import { Injectable, signal, inject, Signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  Catalog,
  LearningTrack,
  LearningLevel,
  CCAFConfig,
  LearningLevelNumber,
  Platform,
  ContentType
} from '../models';
import { QuestionLoaderService } from './question-loader.service';

/**
 * Servicio de curriculo
 * Gestiona el catalogo de tracks de aprendizaje, niveles y configuracion CCA-F.
 * Delega la carga HTTP del catalogo a QuestionLoaderService para evitar duplicacion.
 */
@Injectable({
  providedIn: 'root'
})
export class CurriculumService {

  private loader = inject(QuestionLoaderService);

  /** Catalogo completo almacenado como signal */
  private _catalog = signal<Catalog | null>(null);

  /** Tracks de aprendizaje */
  private _tracks = signal<LearningTrack[]>([]);

  /** Niveles de aprendizaje */
  private _levels = signal<LearningLevel[]>([]);

  // ---------------------------------------------------------------------------
  // Carga de datos
  // ---------------------------------------------------------------------------

  /**
   * Carga el catalogo usando QuestionLoaderService (cache centralizada) y almacena en signals.
   */
  loadCatalog(): Observable<Catalog> {
    return this.loader.loadCatalog().pipe(
      tap(catalog => {
        this._catalog.set(catalog);
        this._tracks.set(catalog.tracks ?? []);
        this._levels.set(catalog.levels ?? []);
      })
    );
  }

  // ---------------------------------------------------------------------------
  // Tracks
  // ---------------------------------------------------------------------------

  /**
   * Signal de solo lectura con todos los tracks.
   */
  getTracks(): Signal<LearningTrack[]> {
    return this._tracks.asReadonly();
  }

  /**
   * Obtiene un track por su ID.
   */
  getTrackById(id: string): LearningTrack | undefined {
    return this._tracks().find(t => t.id === id);
  }

  /**
   * Filtra tracks por nivel de aprendizaje.
   */
  getTracksByLevel(level: LearningLevelNumber): LearningTrack[] {
    return this._tracks().filter(t => t.level === level);
  }

  /**
   * Filtra tracks por plataforma.
   */
  getTracksByPlatform(platform: Platform): LearningTrack[] {
    return this._tracks().filter(t => t.platform === platform);
  }

  // ---------------------------------------------------------------------------
  // Niveles
  // ---------------------------------------------------------------------------

  /**
   * Signal de solo lectura con todos los niveles.
   */
  getLevels(): Signal<LearningLevel[]> {
    return this._levels.asReadonly();
  }

  // ---------------------------------------------------------------------------
  // CCA-F
  // ---------------------------------------------------------------------------

  /**
   * Devuelve la configuracion CCA-F del catalogo, o null si no esta cargado.
   */
  getCCAFConfig(): CCAFConfig | null {
    const catalog = this._catalog();
    return catalog?.ccafConfig ?? null;
  }

  // ---------------------------------------------------------------------------
  // Busqueda
  // ---------------------------------------------------------------------------

  /**
   * Busca tracks cuyo titulo, descripcion o tags coincidan con el query.
   */
  searchTracks(query: string): LearningTrack[] {
    if (!query || query.trim().length === 0) {
      return this._tracks();
    }

    const lower = query.toLowerCase().trim();

    return this._tracks().filter(track => {
      const titleMatch = track.title.toLowerCase().includes(lower);
      const descMatch = track.description.toLowerCase().includes(lower);
      const tagMatch = track.tags?.some(tag => tag.toLowerCase().includes(lower)) ?? false;
      return titleMatch || descMatch || tagMatch;
    });
  }
}

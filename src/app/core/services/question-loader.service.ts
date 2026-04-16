import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Question, Catalog } from '../models';

/**
 * Servicio de carga de preguntas
 * Responsable de la carga HTTP, cache y resolucion de rutas de archivos JSON.
 * Centraliza la lectura del catalogo y de archivos de preguntas
 * para que QuestionBankService y CurriculumService no dupliquen logica.
 */
@Injectable({
  providedIn: 'root',
})
export class QuestionLoaderService {
  private http = inject(HttpClient);

  /** Cache de archivos de preguntas ya cargados (path -> Question[]) */
  private questionFileCache = new Map<string, Question[]>();

  /** Catalogo cargado */
  private catalog: Catalog | null = null;

  // ---------------------------------------------------------------------------
  // Catalogo
  // ---------------------------------------------------------------------------

  /**
   * Carga el catalogo general desde assets/question-bank/catalog.json con cache.
   */
  loadCatalog(): Observable<Catalog> {
    if (this.catalog) {
      return of(this.catalog);
    }

    return this.http.get<Catalog>('assets/question-bank/catalog.json').pipe(
      tap((catalog) => {
        this.catalog = catalog;
      }),
      catchError((error) => {
        console.error('Error cargando catalogo:', error);
        throw error;
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Carga de archivos de preguntas
  // ---------------------------------------------------------------------------

  /**
   * Carga un archivo JSON de preguntas con cache.
   * Soporta tanto formato { questions: [...] } como array plano.
   */
  loadQuestionFile(path: string): Observable<Question[]> {
    const cached = this.questionFileCache.get(path);
    if (cached) {
      return of(cached);
    }

    return this.http.get<Question[] | { questions: Question[] }>(path).pipe(
      map((response) => {
        // Support both { questions: [...] } wrapper and plain array formats
        const questions: Question[] = Array.isArray(response)
          ? response
          : (response?.questions ?? []);
        return questions;
      }),
      tap((questions) => {
        this.questionFileCache.set(path, questions);
      }),
      catchError((error) => {
        console.error(`Error cargando archivo de preguntas: ${path}`, error);
        return of([]);
      }),
    );
  }

  /**
   * Intenta cargar preguntas de multiples rutas, retorna todas las que existan combinadas.
   */
  loadFromMultiplePaths(paths: string[]): Observable<Question[]> {
    if (paths.length === 0) return of([]);

    // Intentar cargar todas y combinar las que existan
    const loads = paths.map((p) =>
      this.loadQuestionFile(p).pipe(catchError(() => of([] as Question[]))),
    );

    return forkJoin(loads).pipe(map((results) => results.flat().filter((q) => q && q.id)));
  }

  // ---------------------------------------------------------------------------
  // Cache
  // ---------------------------------------------------------------------------

  /**
   * Limpia toda la cache de archivos de preguntas y catalogo.
   */
  clearCache(): void {
    this.questionFileCache.clear();
    this.catalog = null;
  }
}

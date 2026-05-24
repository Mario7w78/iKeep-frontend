export interface BloqueSuenoDto {
  dia: number;
  inicio: number;
  fin: number;
}

export interface ContextoUsuarioDto {
  nivel_energia: number;
  horario_inicio: number;
  horario_fin: number;
  bloques_sueno: BloqueSuenoDto[];
}

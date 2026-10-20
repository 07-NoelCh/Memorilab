# Memory Lab Challenge

Juego interactivo para repasar las **cuestiones de diseño de los sistemas de paginación** (sección 3.5 de *Sistemas Operativos Modernos*, Andrew S. Tanenbaum, 3.ª ed., pp. 217-226).

Es la actividad dinámica del trabajo grupal **Memory Lab**: en lugar de solo leer los conceptos, el curso los ve funcionando, juega con ellos y compite en un ranking.

## Qué se aprende en cada nivel

| Nivel | Tema | Qué hay que hacer | Puntaje máx. |
|---|---|---|---|
| 1 | Control de carga, thrashing y swapping (3.5.2) | Llegan procesos cada 4 segundos a una RAM de 16 marcos. Tocar un proceso lo envía al disco (swap out) o lo trae de vuelta (swap in). Hay que mantener la CPU útil en 70% o más durante 30 segundos. | 300 |
| 2 | Tamaño de página (3.5.3) | Un slider cambia el tamaño de página y muestra en vivo la tabla de páginas y la fragmentación interna. Hay 3 rondas (256 KB, 1 MB y 4 MB) para encontrar el tamaño que minimiza la sobrecarga. | 300 |
| 3 | Copy-on-Write (3.5.4 y 3.5.5) | Tras un `fork()`, padre e hijo comparten páginas de solo lectura. En 6 operaciones hay que decidir si el sistema operativo hace una copia privada. | 300 |
| 4 | Trivia | 8 preguntas "¿qué pasa si...?", dos por bloque, con cuatro opciones y explicación de la respuesta. | 280 |

**Puntaje máximo total: 1180.**

### Cómo se puntúa
- **Nivel 1:** 10 puntos por cada segundo en que la CPU útil está en 70% o más.
- **Nivel 2:** 100 puntos si se elige el tamaño exacto, 50 si es el tamaño vecino (sobrecarga hasta 26% mayor) y 10 en otro caso, por cada ronda.
- **Nivel 3:** 50 puntos por cada predicción correcta.
- **Nivel 4:** 25 puntos por respuesta correcta, más hasta 10 de bonus por responder rápido (se reduce 1 punto por segundo).

## Conceptos que cubre

- **Thrashing y swapping:** cuando los conjuntos de trabajo superan la RAM, los fallos de página se disparan, el disco se satura y cae la CPU útil. La solución es sacar procesos al disco. Con muy pocos procesos, en cambio, la CPU queda ociosa.
- **Tamaño de página:** la sobrecarga es `s·e/p + p/2` (tabla de páginas más fragmentación interna). El tamaño óptimo es:

  ```
  p = √(2·s·e)
  ```

  con `s` el tamaño del proceso y `e` los bytes por entrada de tabla. Por ejemplo, con s = 1 MB y e = 8 bytes, p = 4 KB.
- **Copy-on-Write:** tras `fork()` las páginas se comparten en solo lectura. Al escribir, el sistema operativo genera un trap y crea una copia privada solo de esa página; después ambas quedan en lectura-escritura.
- **Asignación local vs. global y PFF** (3.5.1) se trabaja en la presentación y está previsto para una futura versión del juego.

## Ranking compartido y jugadores en vivo

En la versión publicada en Claude el juego incluye:

- **Ranking del curso** con el top 10, actualizado en vivo. Cada jugador conserva su mejor puntaje.
- **Jugando ahora:** quién está conectado, en qué nivel va y cuántos puntos lleva.

Para que funcione, los jugadores deben abrir el enlace con **sesión de Claude** iniciada y con permiso de **colaborador**. Sin eso, el juego se puede jugar igual, pero el ranking no se muestra ni se guarda.

## Cómo usarlo

- **Con ranking:** abrir el enlace compartido de Claude (se puede proyectar un código QR en clase).
- **Sin ranking:** abrir `index.html` con doble clic en el navegador, o desplegarlo en Vercel (ver abajo). Todo funciona salvo el ranking y la lista de conectados.

### Desplegar en Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

Ejecutar los comandos desde la carpeta que contiene `index.html`.

## Tecnología

- HTML, CSS y JavaScript sin dependencias, todo en un único archivo.
- Compatible con modo claro y oscuro, y adaptado a pantallas de celular.
- Sin backend propio: el ranking usa el almacenamiento compartido de la plataforma de publicación.

## Plan B

Si falla internet o el acceso al ranking, usar el archivo local `index.html` o el quiz en diapositivas.

## Equipo

Trabajo grupal de Sistemas Operativos · UPC · 2026
Mariano · Fede · Noel · Dilan

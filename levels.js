// levels.js - Datos y lógica de los 4 niveles del laboratorio

const TRIVIA_QUESTIONS = [
    {
        q: "¿Qué sucede cuando la tasa de fallos de página de un proceso supera el límite superior establecido por el algoritmo PFF (Page Fault Frequency)?",
        options: [
            "Se le asignan más marcos de página para calmar su conjunto de trabajo.",
            "Se le quitan marcos de página para dárselos a procesos más eficientes.",
            "El sistema operativo cambia automáticamente el algoritmo de reemplazo a FIFO.",
            "El proceso se suspende inmediatamente y se termina por falta de memoria."
        ],
        answer: 0,
        explanation: "PFF monitorea los fallos: si superan el límite superior, el proceso necesita más memoria, por lo que se le asignan marcos adicionales."
    },
    {
        q: "¿Cuál es el propósito principal del algoritmo de control de carga Page Fault Frequency (PFF)?",
        options: [
            "Determinar exactamente qué página física debe ser reemplazada en un fallo.",
            "Controlar dinámicamente el tamaño del conjunto de trabajo asignado a cada proceso.",
            "Calcular el tamaño óptimo de página utilizando la fórmula matemática de Belady.",
            "Gestionar el intercambio directo de procesos inactivos hacia el archivo de paginación."
        ],
        answer: 1,
        explanation: "PFF ajusta la asignación de marcos basándose en la frecuencia de fallos para evitar el thrashing."
    },
    {
        q: "Si PFF indica que varios procesos necesitan más marcos de memoria pero la RAM está totalmente saturada y ninguno puede ceder, ¿cuál es la solución real?",
        options: [
            "Implementar un algoritmo de reemplazo de páginas más rápido como LRU aproximado.",
            "Aumentar el tamaño de página para reducir el tamaño de las tablas de páginas.",
            "Suspender temporalmente (swap out) uno o más procesos completos para liberar memoria.",
            "Cambiar de un esquema de asignación de marcos global a un esquema local."
        ],
        answer: 2,
        explanation: "Cuando no hay marcos libres suficientes en la RAM, la única alternativa para reducir la carga es hacer swap out de procesos completos."
    },
    {
        q: "¿Qué consecuencia directa se produce en el sistema operativo si se suspenden (swap out) demasiados procesos hacia el disco?",
        options: [
            "Se incrementan exponencialmente los fallos de página globales en el bus.",
            "La multiprogramación disminuye y la CPU puede quedar desaprovechada u ociosa.",
            "Desaparece por completo la fragmentación interna en las tablas secundarias.",
            "Todas las páginas activas de los procesos restantes pasan automáticamente a modo solo lectura."
        ],
        answer: 1,
        explanation: "Al sacar muchos procesos a disco, baja el grado de multiprogramación y la CPU se queda sin hilos o procesos listos para ejecutar."
    },
    {
        q: "Dada una memoria de trabajo con un tamaño de segmento s = 1 MB y un costo de entrada de tabla e = 8 bytes, ¿cuál es el tamaño de página óptimo según la fórmula p = √(2·s·e)?",
        options: [
            "1024 bytes (1 KB)",
            "2048 bytes (2 KB)",
            "4096 bytes (4 KB)",
            "65536 bytes (64 KB)"
        ],
        answer: 2,
        explanation: "p = √(2 * 1,048,576 bytes * 8 bytes) = √16,777,216 = 4096 bytes (4 KB)."
    },
    {
        q: "Si se incrementa considerablemente el tamaño de página p, ¿cómo se ven afectados los dos componentes de la sobrecarga (tabla de páginas y fragmentación interna)?",
        options: [
            "La tabla de páginas se reduce y la fragmentación interna promedio aumenta.",
            "Ambos componentes de la sobrecarga disminuyen de forma lineal y proporcional.",
            "Ambos componentes de la sobrecarga aumentan debido al espacio desperdiciado.",
            "La tabla de páginas se duplica en tamaño y la fragmentación interna se reduce a cero."
        ],
        answer: 0,
        explanation: "La sobrecarga total es (s·e/p + p/2). Al subir p, el término de la tabla baja y el de la fragmentación interna sube."
    },
    {
        q: "¿Qué tipo de páginas de un proceso se pueden compartir sin riesgos entre un proceso padre y su hijo tras un fork()?",
        options: [
            "Las páginas de datos dinámicos y montículos (heap) modificables.",
            "Las páginas de la pila de ejecución (stack) de cada hilo de control.",
            "Las páginas de solo lectura, como el segmento de código (texto) del programa.",
            "Ninguna página se puede compartir por motivos estrictos de aislamiento y seguridad."
        ],
        answer: 2,
        explanation: "Solo las páginas de solo lectura se pueden compartir de forma segura. Las de escritura requieren el mecanismo Copy-on-Write."
    },
    {
        q: "Tras un fork(), el proceso hijo intenta escribir en una página que inicialmente estaba compartida en modo solo lectura. ¿Qué ocurre internamente?",
        options: [
            "El sistema operativo termina el proceso hijo por violación de segmento de memoria.",
            "Se modifica simultáneamente y sin avisar la página correspondiente en el espacio del padre.",
            "Se copian de golpe todas las páginas del padre hacia el espacio de memoria privado del hijo.",
            "Se genera una interrupción (trap), el SO duplica la página en un marco nuevo y ambas quedan en lectura-escritura."
        ],
        answer: 3,
        explanation: "El intento de escritura en una página protegida genera un trap, y el SO realiza una copia privada exclusivamente de esa página (Copy-on-Write)."
    }
];
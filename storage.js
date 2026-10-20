// storage.js - Sistema de persistencia y ranking local robusto
const STORAGE_KEY = 'memory_lab_ranking_v1';

class RankingManager {
    static getRanking() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return [];

            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) {
                console.error("El ranking guardado no tiene un formato válido.");
                return [];
            }

            return parsed
                .filter(entry =>
                    entry &&
                    typeof entry.name === 'string' &&
                    entry.name.trim() &&
                    Number.isFinite(entry.score) &&
                    entry.score >= 0
                )
                .map(entry => ({
                    id: typeof entry.id === 'string' ? entry.id : '',
                    name: entry.name.trim().slice(0, 20),
                    score: Math.round(entry.score),
                    date: typeof entry.date === 'string' ? entry.date : ''
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
        } catch (e) {
            console.error("Error al leer el ranking:", e);
            return [];
        }
    }

    static saveScore(name, score) {
        const cleanName = typeof name === 'string' ? name.trim().slice(0, 20) : '';
        if (!cleanName || !Number.isFinite(score) || score < 0) return this.getRanking();

        const roundedScore = Math.round(score);
        const ranking = this.getRanking();
        const existingIndex = ranking.findIndex(r => r.name.toLowerCase() === cleanName.toLowerCase());

        if (existingIndex >= 0) {
            // Si ya existe, actualizamos solo si el nuevo puntaje es mayor
            if (roundedScore > ranking[existingIndex].score) {
                ranking[existingIndex].score = roundedScore;
                ranking[existingIndex].date = new Date().toLocaleDateString();
            }
        } else {
            ranking.push({
                id: '_' + Math.random().toString(36).substr(2, 9),
                name: cleanName,
                score: roundedScore,
                date: new Date().toLocaleDateString()
            });
        }

        // Ordenar de mayor a menor puntaje y limitar a los mejores 10
        ranking.sort((a, b) => b.score - a.score);
        const topRanking = ranking.slice(0, 10);

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(topRanking));
        } catch (e) {
            console.error("Error al guardar en localStorage:", e);
        }

        return topRanking;
    }
}
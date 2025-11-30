# 🤖 Comment fonctionne l'analyse LLM

## 📋 Vue d'ensemble

L'analyse LLM utilise **OpenAI GPT-4o-mini** pour analyser les transcriptions audio et extraire des informations structurées sur les shifts de travail.

## 🔄 Flow complet

### 1. Check-in (Démarrage du shift)

```
Audio → AssemblyAI → Transcription → LLM → Analyse
```

**Ce qui se passe :**
1. L'audio est transcrit par AssemblyAI
2. La transcription est envoyée à OpenAI avec un prompt spécialisé
3. Le LLM analyse et retourne :
   - `job_type` : Type de travail (ex: "childcare", "cleaning", etc.)
   - `notes` : Notes extraites de la transcription

**Prompt utilisé :** `analyseStartShift`
- Analyse uniquement le check-in
- Extrait le type de travail
- Notes préliminaires

### 2. Check-out (Fin du shift)

```
Audio → AssemblyAI → Transcription → LLM → Analyse complète
```

**Ce qui se passe :**
1. L'audio de check-out est transcrit
2. Les DEUX transcriptions (check-in + check-out) sont envoyées au LLM
3. Le LLM fait une analyse complète avec :
   - Vérification de cohérence (heures, horaires)
   - Détection de problèmes
   - Flags de risque et légalité
   - Confiance dans l'analyse

**Prompt utilisé :** `analyseShift`
- Analyse complète du shift
- Vérifie la cohérence temporelle
- Détecte les violations légales
- Identifie les risques

## 📊 Structure de l'analyse LLM

L'analyse retourne un objet JSON avec :

```json
{
  "job_type": "childcare" | "cleaning" | "unknown",
  "notes": "Notes extraites de la transcription",
  "issues": [
    "Problème 1",
    "Problème 2"
  ],
  "risk_flags": [
    "emotional_load",
    "physical_strain"
  ],
  "legal_flags": [
    "overtime_violation",
    "break_violation"
  ],
  "confidence": 0.0 à 1.0
}
```

### Champs expliqués

- **`job_type`** : Type de travail identifié
- **`notes`** : Résumé ou notes importantes
- **`issues`** : Problèmes détectés (incohérences, etc.)
- **`risk_flags`** : Risques identifiés (charge émotionnelle, etc.)
- **`legal_flags`** : Violations légales potentielles (heures sup, pauses, etc.)
- **`confidence`** : Niveau de confiance de l'analyse (0.0 à 1.0)

## 🎯 Utilisation dans l'application

### Check-in
- Le LLM identifie le type de travail
- Stocké dans `llm_structured_json` de la work_session

### Check-out
- Analyse complète avec vérifications
- Détecte les problèmes avant validation
- Aide l'employer à prendre une décision

### Validation
- L'employer peut voir l'analyse LLM
- Décide de valider ou refuser selon les flags
- Les flags légaux sont particulièrement importants

## 🔧 Configuration

**Modèle utilisé :** `gpt-4o-mini`
- Rapide et économique
- Suffisant pour l'analyse de shifts
- Peut être changé pour `gpt-4` pour plus de précision

**Temperature :** `0.3`
- Faible température = réponses plus cohérentes
- Moins de créativité, plus de précision

**Format :** `json_object`
- Force le LLM à retourner du JSON valide
- Facilite le parsing

## 📝 Prompts utilisés

Les prompts sont définis dans `src/config/prompts.ts` :

- **`system.shiftAnalysis`** : Instructions système pour l'analyse complète
- **`user.shiftAnalysis`** : Prompt utilisateur avec les transcriptions
- **`system.startShift`** : Instructions pour le check-in
- **`user.startShift`** : Prompt pour le check-in

## 🐛 Gestion d'erreurs

Si le LLM échoue :
- Retourne une analyse par défaut
- `job_type: "unknown"`
- `confidence: 0.5`
- Pas de flags de risque/légalité

## 💡 Améliorations possibles

- Utiliser `gpt-4` pour plus de précision
- Ajouter des prompts spécifiques par type de travail
- Améliorer la détection des violations légales
- Ajouter des checks de cohérence temporelle plus stricts


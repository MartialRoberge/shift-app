-- Seed data pour la démo Fair Work
-- 10 workers, 3 agences, missions et shifts avec transactions XRPL réalistes
-- Données cohérentes pour la démonstration du hackathon

-- Nettoyer les données existantes (ATTENTION: supprime tout!)
DELETE FROM work_sessions;
DELETE FROM mission_workers;
DELETE FROM mission_applications;
DELETE FROM missions;
DELETE FROM users;

-- ============================================
-- AGENCES / EMPLOYERS (3)
-- ============================================

-- Agence 1: CleanPro Services (Paris) - Spécialiste nettoyage
INSERT INTO users (id, role, name, email, xrpl_address, password_hash)
VALUES (
  'a1000000-0000-4000-8000-000000000001',
  'employer',
  'CleanPro Services',
  'contact@cleanpro.fr',
  'rE5kNy4C3g42y9eXG3BJk64QkigVdR2Q2P',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
);

-- Agence 2: Lyon Interim Plus (Lyon) - Manutention et logistique
INSERT INTO users (id, role, name, email, xrpl_address, password_hash)
VALUES (
  'a1000000-0000-4000-8000-000000000002',
  'employer',
  'Lyon Interim Plus',
  'rh@lyoninterim.fr',
  'rHJgUq9hn6n6xHZ4kSvCgYJBwF5DJQZLCX',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
);

-- Agence 3: Med Services (Marseille) - Restauration et événementiel
INSERT INTO users (id, role, name, email, xrpl_address, password_hash)
VALUES (
  'a1000000-0000-4000-8000-000000000003',
  'employer',
  'Med Services',
  'jobs@medservices.com',
  'rPWNqqxzJETYKvvLxXkaL9hzTEaSBUPFEM',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
);

-- ============================================
-- TRAVAILLEURS / WORKERS (10)
-- ============================================

-- Worker 1 - Marie Dupont (Paris) - Nettoyage
INSERT INTO users (id, role, name, email, xrpl_address, password_hash)
VALUES (
  'b1000000-0000-4000-8000-000000000001',
  'worker',
  'Marie Dupont',
  'marie.dupont@email.com',
  'rw91LZjQNPCk1FV1Fj3QUG3x2UaoBsywQ5',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
);

-- Worker 2 - Ahmed Benali (Paris) - Garde d'enfants
INSERT INTO users (id, role, name, email, xrpl_address, password_hash)
VALUES (
  'b1000000-0000-4000-8000-000000000002',
  'worker',
  'Ahmed Benali',
  'ahmed.b@email.com',
  'rMxQDBCBVDSRKHNEPtfrJLzWUQ4NvRKgFj',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
);

-- Worker 3 - Sophie Martin (Lyon) - Manutention
INSERT INTO users (id, role, name, email, xrpl_address, password_hash)
VALUES (
  'b1000000-0000-4000-8000-000000000003',
  'worker',
  'Sophie Martin',
  'sophie.martin@email.com',
  'rKiCet8SdvWxPXnAgYarFUXMh1zCPz432Y',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
);

-- Worker 4 - Lucas Moreau (Lyon) - Manutention
INSERT INTO users (id, role, name, email, xrpl_address, password_hash)
VALUES (
  'b1000000-0000-4000-8000-000000000004',
  'worker',
  'Lucas Moreau',
  'lucas.m@email.com',
  'rBW8UJV8Vsy7WKmVyNPUvZUpj9PRwsPmfE',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
);

-- Worker 5 - Fatima Zahra (Marseille) - Restauration
INSERT INTO users (id, role, name, email, xrpl_address, password_hash)
VALUES (
  'b1000000-0000-4000-8000-000000000005',
  'worker',
  'Fatima Zahra',
  'fatima.z@email.com',
  'rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
);

-- Worker 6 - Thomas Bernard (Marseille) - Restauration
INSERT INTO users (id, role, name, email, xrpl_address, password_hash)
VALUES (
  'b1000000-0000-4000-8000-000000000006',
  'worker',
  'Thomas Bernard',
  'thomas.b@email.com',
  'rUdJ8YPmMkn6x9HqaCthLHy6eGPQ9W9FaC',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
);

-- Worker 7 - Julie Lefebvre (Bordeaux) - Polyvalente
INSERT INTO users (id, role, name, email, xrpl_address, password_hash)
VALUES (
  'b1000000-0000-4000-8000-000000000007',
  'worker',
  'Julie Lefebvre',
  'julie.l@email.com',
  'r4dgY6Mzob3NVq8CFYdEiPnXKboRScsXRu',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
);

-- Worker 8 - Pierre Durand (Lille) - Manutention
INSERT INTO users (id, role, name, email, xrpl_address, password_hash)
VALUES (
  'b1000000-0000-4000-8000-000000000008',
  'worker',
  'Pierre Durand',
  'pierre.d@email.com',
  'rErQkqrm7aRrhTQqLPZ1P3YPMgf2xRuZ9',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
);

-- Worker 9 - Emma Petit (Toulouse) - Aide à domicile
INSERT INTO users (id, role, name, email, xrpl_address, password_hash)
VALUES (
  'b1000000-0000-4000-8000-000000000009',
  'worker',
  'Emma Petit',
  'emma.p@email.com',
  'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
);

-- Worker 10 - Karim Hadj (Nantes) - Logistique
INSERT INTO users (id, role, name, email, xrpl_address, password_hash)
VALUES (
  'b1000000-0000-4000-8000-00000000000a',
  'worker',
  'Karim Hadj',
  'karim.h@email.com',
  'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
);

-- ============================================
-- MISSIONS (6 missions actives)
-- ============================================

-- Mission 1 - CleanPro: Nettoyage bureaux La Défense
INSERT INTO missions (id, employer_id, title, description, location, address, hourly_rate, total_hours_needed, hours_completed, status)
VALUES (
  'c1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  'Nettoyage bureaux La Défense',
  'Nettoyage quotidien des bureaux open-space (200m²), sanitaires et salles de réunion. Entreprise tech, ambiance moderne.',
  'La Défense, Paris',
  '1 Parvis de la Défense, 92800 Puteaux',
  14.50,
  40,
  11.0,
  'active'
);

-- Mission 2 - CleanPro: Garde d'enfants Paris 15e
INSERT INTO missions (id, employer_id, title, description, location, address, hourly_rate, total_hours_needed, hours_completed, status)
VALUES (
  'c1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000001',
  'Garde enfants après école',
  'Récupérer 2 enfants (6 et 8 ans) à l''école à 16h30. Goûter, aide aux devoirs et jeux jusqu''à 19h.',
  'Paris 15ème',
  '45 Rue de Vaugirard, 75015 Paris',
  13.00,
  20,
  4.0,
  'active'
);

-- Mission 3 - Lyon Interim: Manutention Part-Dieu
INSERT INTO missions (id, employer_id, title, description, location, address, hourly_rate, total_hours_needed, hours_completed, status)
VALUES (
  'c1000000-0000-4000-8000-000000000003',
  'a1000000-0000-4000-8000-000000000002',
  'Manutention entrepôt Part-Dieu',
  'Préparation de commandes e-commerce. Déchargement camions et chargement palettes. Port de charges 15kg max.',
  'Lyon Part-Dieu',
  '17 Rue Garibaldi, 69006 Lyon',
  12.00,
  60,
  20.0,
  'active'
);

-- Mission 4 - Med Services: Service restaurant Vieux Port
INSERT INTO missions (id, employer_id, title, description, location, address, hourly_rate, total_hours_needed, hours_completed, status)
VALUES (
  'c1000000-0000-4000-8000-000000000004',
  'a1000000-0000-4000-8000-000000000003',
  'Service restaurant Vieux Port',
  'Service en salle, prise de commandes et encaissement. Restaurant gastronomique 50 couverts. Expérience appréciée.',
  'Vieux Port, Marseille',
  '24 Quai du Port, 13002 Marseille',
  11.50,
  80,
  14.0,
  'active'
);

-- Mission 5 - Lyon Interim: Inventaire entrepôt
INSERT INTO missions (id, employer_id, title, description, location, address, hourly_rate, total_hours_needed, hours_completed, status)
VALUES (
  'c1000000-0000-4000-8000-000000000005',
  'a1000000-0000-4000-8000-000000000002',
  'Inventaire annuel entrepôt',
  'Comptage et scan des produits pour inventaire de fin d''année. Formation sur tablette fournie. Mission ponctuelle.',
  'Villeurbanne',
  '25 Avenue Lacassagne, 69003 Lyon',
  11.00,
  30,
  0,
  'active'
);

-- Mission 6 - Med Services: Événement traiteur
INSERT INTO missions (id, employer_id, title, description, location, address, hourly_rate, total_hours_needed, hours_completed, status)
VALUES (
  'c1000000-0000-4000-8000-000000000006',
  'a1000000-0000-4000-8000-000000000003',
  'Service traiteur mariage',
  'Service pour mariage 150 personnes. Dressage des tables, service au plat, débarrassage. Tenue de service fournie.',
  'Aix-en-Provence',
  'Château de la Gaude, 13100 Aix-en-Provence',
  15.00,
  50,
  0,
  'active'
);

-- ============================================
-- WORK SESSIONS / SHIFTS
-- ============================================

-- ========== SHIFTS CLEANPRO (Marie) ==========

-- Shift 1 - Marie - PAID (il y a 7 jours)
INSERT INTO work_sessions (
  id, worker_id, employer_id, mission_id, start_time, end_time,
  stt_start_text, stt_end_text,
  llm_structured_json, hours, hourly_rate, amount_total, status,
  xrpl_escrow_tx, xrpl_nft_id, xrpl_payment_tx
)
VALUES (
  'd1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000001',
  NOW() - INTERVAL '7 days' + INTERVAL '8 hours',
  NOW() - INTERVAL '7 days' + INTERVAL '11 hours',
  'Je commence le nettoyage ce matin. Les bureaux sont assez propres.',
  'Terminé plus vite que prévu aujourd''hui. Tout était déjà bien rangé.',
  '{"job_type": "nettoyage", "notes": "Nettoyage rapide - bureaux déjà propres", "summary": "3h de nettoyage. Bureaux déjà propres, travail efficace.", "sentiment": "positive", "energy_level": 0.9, "mood": "content", "issues": [], "risk_flags": [], "legal_flags": [], "key_phrases": ["terminé plus vite", "bien rangé"], "recommendations": [], "confidence": 0.94}',
  3.0, 14.50, 43.50, 'paid',
  'B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9',
  '000800007F1A7058A6E7E3D4E6B8E0A2D4F6B8E0A2D4F6B8E0A2D4F6B8E0A2D4F6B8',
  'C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0'
);

-- Shift 2 - Marie - PAID (il y a 3 jours)
INSERT INTO work_sessions (
  id, worker_id, employer_id, mission_id, start_time, end_time,
  stt_start_text, stt_end_text,
  llm_structured_json, hours, hourly_rate, amount_total, status,
  xrpl_escrow_tx, xrpl_nft_id, xrpl_payment_tx
)
VALUES (
  'd1000000-0000-4000-8000-000000000002',
  'b1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000001',
  NOW() - INTERVAL '3 days' + INTERVAL '8 hours',
  NOW() - INTERVAL '3 days' + INTERVAL '12 hours',
  'Bonjour, je commence mon shift de nettoyage au bureau de la Défense. Il y a beaucoup de travail aujourd''hui, les salles de réunion sont en désordre.',
  'Voilà, j''ai terminé. J''ai nettoyé tous les bureaux, les sanitaires sont propres et j''ai vidé les poubelles. Bonne journée !',
  '{"job_type": "nettoyage", "notes": "Nettoyage complet des bureaux", "summary": "4h de nettoyage intensif. Salles de réunion en désordre, tout remis en état.", "sentiment": "positive", "energy_level": 0.8, "mood": "satisfait", "issues": [], "risk_flags": [], "legal_flags": [], "key_phrases": ["beaucoup de travail", "salles de réunion", "bureaux propres"], "recommendations": ["Prévoir plus de temps pour les salles de réunion"], "confidence": 0.95}',
  4.0, 14.50, 58.00, 'paid',
  'A8E7B4C9D1F2E3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8',
  '000800007A6E2503D19E2C8F9B1D3E5A7C9F0B2D4E6A8C0F2B4D6E8A0C2F4B6D8E0A2C4D6',
  'F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2'
);

-- Shift 3 - Marie - VALIDATED (hier, en attente paiement)
INSERT INTO work_sessions (
  id, worker_id, employer_id, mission_id, start_time, end_time,
  stt_start_text, stt_end_text,
  llm_structured_json, hours, hourly_rate, amount_total, status,
  xrpl_escrow_tx, xrpl_nft_id
)
VALUES (
  'd1000000-0000-4000-8000-000000000003',
  'b1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000001',
  NOW() - INTERVAL '1 day' + INTERVAL '9 hours',
  NOW() - INTERVAL '1 day' + INTERVAL '13 hours',
  'Salut, je commence le nettoyage aujourd''hui. Je me sens bien, prête à travailler.',
  'Terminé ! Tout est nickel. J''ai fait un peu plus que d''habitude car il y avait une réunion importante demain.',
  '{"job_type": "nettoyage", "notes": "Nettoyage approfondi avant réunion", "summary": "4h de nettoyage avec attention particulière pour préparer une réunion importante.", "sentiment": "positive", "energy_level": 0.85, "mood": "motivé", "issues": [], "risk_flags": [], "legal_flags": [], "key_phrases": ["réunion importante", "tout est nickel", "prête à travailler"], "recommendations": [], "confidence": 0.92}',
  4.0, 14.50, 58.00, 'validated',
  'B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3',
  '000800007B7F3614E2A3D9F0C2E4A6B8D0F2A4C6E8B0D2F4A6C8E0B2D4F6A8C0E2B4D6F8'
);

-- ========== SHIFTS CLEANPRO (Ahmed - garde enfants) ==========

-- Shift 4 - Ahmed - PROPOSED (aujourd'hui)
INSERT INTO work_sessions (
  id, worker_id, employer_id, mission_id, start_time, end_time,
  stt_start_text, stt_end_text,
  llm_structured_json, hours, hourly_rate, amount_total, status
)
VALUES (
  'd1000000-0000-4000-8000-000000000004',
  'b1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000002',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '2 hours',
  'Je commence la garde des enfants. Je vais les chercher à l''école dans 10 minutes.',
  'Les enfants ont fait leurs devoirs et ont goûté. Ils jouent maintenant en attendant leurs parents. Tout s''est bien passé.',
  '{"job_type": "garde_enfants", "notes": "Garde après école - 2 enfants", "summary": "4h de garde: récupération école, goûter, aide aux devoirs et jeux.", "sentiment": "positive", "energy_level": 0.75, "mood": "calme", "issues": [], "risk_flags": [], "legal_flags": [], "key_phrases": ["école", "devoirs", "goûter", "tout s''est bien passé"], "recommendations": [], "confidence": 0.88}',
  4.0, 13.00, 52.00, 'proposed'
);

-- ========== SHIFTS LYON INTERIM (Sophie, Lucas) ==========

-- Shift 5 - Sophie - PAID (il y a 10 jours)
INSERT INTO work_sessions (
  id, worker_id, employer_id, mission_id, start_time, end_time,
  stt_start_text, stt_end_text,
  llm_structured_json, hours, hourly_rate, amount_total, status,
  xrpl_escrow_tx, xrpl_nft_id, xrpl_payment_tx
)
VALUES (
  'd1000000-0000-4000-8000-000000000005',
  'b1000000-0000-4000-8000-000000000003',
  'a1000000-0000-4000-8000-000000000002',
  'c1000000-0000-4000-8000-000000000003',
  NOW() - INTERVAL '10 days' + INTERVAL '6 hours',
  NOW() - INTERVAL '10 days' + INTERVAL '12 hours',
  'Début de journée à l''entrepôt. Grosse livraison prévue.',
  'Journée bien remplie ! Livraison de 500 colis traitée.',
  '{"job_type": "manutention", "notes": "Livraison exceptionnelle 500 colis", "summary": "6h de travail intensif pour traiter une livraison de 500 colis.", "sentiment": "positive", "energy_level": 0.55, "mood": "fatigué mais content", "issues": ["fatigue"], "risk_flags": ["fatigue"], "legal_flags": [], "key_phrases": ["500 colis", "journée bien remplie"], "recommendations": ["Renforcer l''équipe pour les grosses livraisons"], "confidence": 0.90}',
  6.0, 12.00, 72.00, 'paid',
  'D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1',
  '000800007E2A8169A7F8A4E5E7C9F1A3E5E7C9F1A3E5E7C9F1A3E5E7C9F1A3E5E7C9',
  'E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2'
);

-- Shift 6 - Sophie - PAID (il y a 5 jours)
INSERT INTO work_sessions (
  id, worker_id, employer_id, mission_id, start_time, end_time,
  stt_start_text, stt_end_text,
  llm_structured_json, hours, hourly_rate, amount_total, status,
  xrpl_escrow_tx, xrpl_nft_id, xrpl_payment_tx
)
VALUES (
  'd1000000-0000-4000-8000-000000000006',
  'b1000000-0000-4000-8000-000000000003',
  'a1000000-0000-4000-8000-000000000002',
  'c1000000-0000-4000-8000-000000000003',
  NOW() - INTERVAL '5 days' + INTERVAL '6 hours',
  NOW() - INTERVAL '5 days' + INTERVAL '14 hours',
  'Début du shift à l''entrepôt. J''ai ma tenue de sécurité, je suis prête pour la manutention.',
  'Grosse journée ! On a déchargé 3 camions et préparé plus de 100 commandes. Je suis fatiguée mais satisfaite.',
  '{"job_type": "manutention", "notes": "Journée intense - 3 camions + 100 commandes", "summary": "8h de manutention: déchargement de 3 camions et préparation de +100 commandes.", "sentiment": "positive", "energy_level": 0.5, "mood": "épuisé mais fier", "issues": ["fatigue"], "risk_flags": ["fatigue"], "legal_flags": [], "key_phrases": ["3 camions", "100 commandes", "fatiguée mais satisfaite"], "recommendations": ["Prévoir des pauses régulières"], "confidence": 0.91}',
  8.0, 12.00, 96.00, 'paid',
  'C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4',
  '000800007C8E4725F3B4E0A1D3F5B7C9E1A3C5F7B9D1E3A5C7F9B1D3E5A7C9F1B3D5',
  'D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5'
);

-- Shift 7 - Lucas - VALIDATED (il y a 2 jours)
INSERT INTO work_sessions (
  id, worker_id, employer_id, mission_id, start_time, end_time,
  stt_start_text, stt_end_text,
  llm_structured_json, hours, hourly_rate, amount_total, status,
  xrpl_escrow_tx, xrpl_nft_id
)
VALUES (
  'd1000000-0000-4000-8000-000000000007',
  'b1000000-0000-4000-8000-000000000004',
  'a1000000-0000-4000-8000-000000000002',
  'c1000000-0000-4000-8000-000000000003',
  NOW() - INTERVAL '2 days' + INTERVAL '7 hours',
  NOW() - INTERVAL '2 days' + INTERVAL '13 hours',
  'Je démarre mon shift à l''entrepôt. Aujourd''hui je m''occupe de la préparation de commandes.',
  'J''ai terminé avec 85 commandes préparées. Bonne productivité aujourd''hui !',
  '{"job_type": "manutention", "notes": "85 commandes préparées", "summary": "6h de préparation de commandes. Excellente productivité avec 85 commandes.", "sentiment": "positive", "energy_level": 0.7, "mood": "productif", "issues": [], "risk_flags": [], "legal_flags": [], "key_phrases": ["85 commandes", "bonne productivité"], "recommendations": [], "confidence": 0.93}',
  6.0, 12.00, 72.00, 'validated',
  'E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6',
  '000800007D9E5836E4C5F1B2E4A6C8F0B2D4A6C8E0B2D4F6A8C0E2B4D6F8A0C2E4B6'
);

-- ========== SHIFTS MED SERVICES (Fatima, Thomas) ==========

-- Shift 8 - Fatima - PAID (il y a 8 jours)
INSERT INTO work_sessions (
  id, worker_id, employer_id, mission_id, start_time, end_time,
  stt_start_text, stt_end_text,
  llm_structured_json, hours, hourly_rate, amount_total, status,
  xrpl_escrow_tx, xrpl_nft_id, xrpl_payment_tx
)
VALUES (
  'd1000000-0000-4000-8000-000000000008',
  'b1000000-0000-4000-8000-000000000005',
  'a1000000-0000-4000-8000-000000000003',
  'c1000000-0000-4000-8000-000000000004',
  NOW() - INTERVAL '8 days' + INTERVAL '19 hours',
  NOW() - INTERVAL '8 days' + INTERVAL '23 hours',
  'Service du vendredi soir ! On va avoir du monde.',
  'Record battu ce soir ! 95 couverts, super ambiance.',
  '{"job_type": "restauration", "notes": "Record du restaurant - 95 couverts", "summary": "4h de service exceptionnel avec 95 couverts - nouveau record.", "sentiment": "positive", "energy_level": 0.7, "mood": "enthousiaste", "issues": [], "risk_flags": [], "legal_flags": [], "key_phrases": ["record battu", "95 couverts", "super ambiance"], "recommendations": [], "confidence": 0.96}',
  4.0, 11.50, 46.00, 'paid',
  'F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3',
  '000800007E3A9270A8E9A5F6A8D0E2B4F6D8B0F2D4B6D8B0F2D4B6D8B0F2D4B6D8B0',
  'A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4'
);

-- Shift 9 - Fatima - PAID (il y a 4 jours)
INSERT INTO work_sessions (
  id, worker_id, employer_id, mission_id, start_time, end_time,
  stt_start_text, stt_end_text,
  llm_structured_json, hours, hourly_rate, amount_total, status,
  xrpl_escrow_tx, xrpl_nft_id, xrpl_payment_tx
)
VALUES (
  'd1000000-0000-4000-8000-000000000009',
  'b1000000-0000-4000-8000-000000000005',
  'a1000000-0000-4000-8000-000000000003',
  'c1000000-0000-4000-8000-000000000004',
  NOW() - INTERVAL '4 days' + INTERVAL '18 hours',
  NOW() - INTERVAL '4 days' + INTERVAL '23 hours',
  'Service du soir au restaurant. On attend beaucoup de monde ce soir, c''est le weekend.',
  'Super service ! On a fait 80 couverts, les clients étaient contents. Pourboires inclus.',
  '{"job_type": "restauration", "notes": "Service week-end - 80 couverts", "summary": "5h de service en restauration. Salle pleine avec 80 couverts servis.", "sentiment": "positive", "energy_level": 0.65, "mood": "satisfait", "issues": [], "risk_flags": [], "legal_flags": [], "key_phrases": ["80 couverts", "clients contents", "pourboires"], "recommendations": [], "confidence": 0.89}',
  5.0, 11.50, 57.50, 'paid',
  'F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7',
  '000800007E0A6947E5D6E2C3F5A7D9F1B3E5A7C9F1B3D5E7A9C1F3B5D7E9A1C3F5B7',
  'A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8'
);

-- Shift 10 - Thomas - PROPOSED (aujourd'hui)
INSERT INTO work_sessions (
  id, worker_id, employer_id, mission_id, start_time, end_time,
  stt_start_text, stt_end_text,
  llm_structured_json, hours, hourly_rate, amount_total, status
)
VALUES (
  'd1000000-0000-4000-8000-00000000000a',
  'b1000000-0000-4000-8000-000000000006',
  'a1000000-0000-4000-8000-000000000003',
  'c1000000-0000-4000-8000-000000000004',
  NOW() - INTERVAL '8 hours',
  NOW() - INTERVAL '3 hours',
  'Je commence le service du midi. Le restaurant est déjà presque plein.',
  'Service terminé, on a eu 45 couverts. Quelques problèmes en cuisine mais on a géré.',
  '{"job_type": "restauration", "notes": "Service midi - problèmes cuisine", "summary": "5h de service du midi avec 45 couverts. Difficultés en cuisine mais bien gérées.", "sentiment": "neutral", "energy_level": 0.6, "mood": "stressé", "issues": ["problèmes en cuisine"], "risk_flags": ["stress"], "legal_flags": [], "key_phrases": ["45 couverts", "problèmes en cuisine", "on a géré"], "recommendations": ["Améliorer la coordination avec la cuisine"], "confidence": 0.85}',
  5.0, 11.50, 57.50, 'proposed'
);

-- ============================================
-- MISSION WORKERS (Travailleurs assignés aux missions)
-- ============================================

INSERT INTO mission_workers (worker_id, mission_id, hours_worked)
VALUES
  ('b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 11.0),  -- Marie -> Nettoyage Défense
  ('b1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', 4.0),   -- Ahmed -> Garde enfants
  ('b1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000003', 14.0),  -- Sophie -> Manutention Lyon
  ('b1000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000003', 6.0),   -- Lucas -> Manutention Lyon
  ('b1000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000004', 9.0),   -- Fatima -> Restaurant Marseille
  ('b1000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000004', 5.0);   -- Thomas -> Restaurant Marseille

-- ============================================
-- CANDIDATURES EN ATTENTE (pour les nouvelles missions)
-- ============================================

INSERT INTO mission_applications (mission_id, worker_id, message, status)
VALUES
  ('c1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000003', 'Je suis disponible pour l''inventaire. J''ai déjà fait ce type de mission.', 'pending'),
  ('c1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000008', 'Je suis très organisé et minutieux, parfait pour l''inventaire.', 'pending'),
  ('c1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000005', 'J''ai une expérience en service traiteur. Très motivée !', 'pending'),
  ('c1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000007', 'Je recherche ce type de mission événementielle.', 'pending');

-- ============================================
-- RÉSUMÉ POUR LA DÉMO
-- ============================================
--
-- AGENCES:
-- 1. CleanPro Services (Paris) - contact@cleanpro.fr
--    → 2 missions: Nettoyage Défense, Garde enfants
--    → Workers: Marie (nettoyage), Ahmed (garde)
--
-- 2. Lyon Interim Plus (Lyon) - rh@lyoninterim.fr
--    → 2 missions: Manutention Part-Dieu, Inventaire
--    → Workers: Sophie, Lucas (manutention)
--
-- 3. Med Services (Marseille) - jobs@medservices.com
--    → 2 missions: Restaurant Vieux Port, Traiteur mariage
--    → Workers: Fatima, Thomas (restauration)
--
-- WORKERS (logins avec _worker suffix):
-- 1. Marie Dupont - marie_worker - 3 shifts (159.50€ total)
-- 2. Ahmed Benali - ahmed_worker - 1 shift proposé (52€)
-- 3. Sophie Martin - sophie_worker - 2 shifts payés (168€)
-- 4. Lucas Moreau - lucas_worker - 1 shift validé (72€)
-- 5. Fatima Zahra - fatima_worker - 2 shifts payés (103.50€)
-- 6. Thomas Bernard - thomas_worker - 1 shift proposé (57.50€)
-- 7. Julie Lefebvre - julie_worker - nouveau (0€)
-- 8. Pierre Durand - pierre_worker - candidat inventaire
-- 9. Emma Petit - emma_worker - nouveau (0€)
-- 10. Karim Hadj - karim_worker - nouveau (0€)
--
-- TRANSACTIONS XRPL (testnet):
-- - 7 shifts avec escrow créé
-- - 5 shifts avec paiement effectué
-- - Total payé: ~431€ (≈862 XRP)

SELECT 'Fair Work seed data inserted successfully!' AS status;
SELECT 'Agences: ' || COUNT(*) FROM users WHERE role = 'employer';
SELECT 'Workers: ' || COUNT(*) FROM users WHERE role = 'worker';
SELECT 'Missions: ' || COUNT(*) FROM missions;
SELECT 'Shifts: ' || COUNT(*) FROM work_sessions;

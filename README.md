📝 Tasker - SAEGUS Technical Test
📌 Description

Ce projet est une application de gestion de tâches inspirée de Wunderlist ou Google Tasks.
Elle permet aux utilisateurs de :

Créer et gérer des listes de tâches.

Ajouter, modifier, compléter ou supprimer des tâches.

S’authentifier via un système sécurisé avec JWT.

L’application est découpée en deux sections principales :

Page d’authentification (connexion / inscription).

Page principale (sidebar gauche, contenu central, sidebar droite).


🚀 Technologies utilisées
Backend

Node.js + Express.js pour l’API REST

JWT (JSON Web Token) pour l’authentification/autorisation

MySQL SGBD
 
Docker pour la gestion et le déploiement de la base de données

⚙️ Fonctionnalités
🔑 Authentification

Connexion avec username / mot de passe.

Inscription avec nom, prénom, email, mot de passe (+ vérification).

Gestion de session sécurisée via JWT.

📋 Gestion des listes

Créer une nouvelle liste (nom unique).

Afficher toutes les listes.

Sélectionner une liste pour voir son contenu.

Supprimer une liste (avec confirmation).

✅ Gestion des tâches

Ajouter une tâche avec :

Courte description (obligatoire)

Description longue (optionnelle)

Date d’échéance (obligatoire)

Marquer une tâche comme complétée / revenir en "à faire".

Voir l’historique des tâches complétées.

Supprimer une tâche (avec confirmation).

🖼 UI

Sidebar gauche : navigation entre les listes.

Contenu principal : affichage des tâches.

Sidebar droite : détails d’une tâche.

Sidebars rétractables.

Messages clairs si aucune liste/tâche n’est sélectionnée.

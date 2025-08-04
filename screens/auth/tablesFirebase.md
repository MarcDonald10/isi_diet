Users (Utilisateurs)  Description : Stocke les informations des utilisateurs (patients et diététiciens).
Champs :user_id (INT, PK) : Identifiant unique.
user_type (ENUM: 'patient', 'dietetician') : Type d'utilisateur.
first_name (VARCHAR) : Prénom.
last_name (VARCHAR) : Nom.
email (VARCHAR, UNIQUE) : Email.
password_hash (VARCHAR) : Mot de passe haché.
phone (VARCHAR) : Numéro de téléphone.
created_at (DATETIME) : Date de création.
updated_at (DATETIME) : Date de mise à jour.

Relations : Liée aux tables Patients, Dieticians, Messages, Appointments, Subscriptions.

Patients  Description : Informations spécifiques aux patients (extension de Users).
Champs :patient_id (INT, PK) : Identifiant unique.
user_id (INT, FK → Users) : Référence à l'utilisateur.
age (INT) : Âge.
gender (ENUM: 'M', 'F', 'Other') : Sexe.
weight (FLOAT) : Poids (kg).
height (FLOAT) : Taille (cm).
objective (TEXT) : Objectifs nutritionnels (ex. perte de poids).

Relations : Liée à User_Medical_Conditions, Consultations, Nutritional_Plans.

Dieticians  Description : Informations spécifiques aux diététiciens.
Champs :dietician_id (INT, PK) : Identifiant unique.
user_id (INT, FK → Users) : Référence à l'utilisateur.
qualifications (TEXT) : Diplômes et certifications.
specialty (VARCHAR) : Spécialité (ex. diabète, obésité).

Relations : Liée à Master_Classes, Consultations, Messages.

Medical_Conditions  Description : Liste des pathologies possibles.
Champs :condition_id (INT, PK) : Identifiant unique.
name (VARCHAR) : Nom de la pathologie (ex. diabète, hypertension).
description (TEXT) : Description.

Relations : Liée à User_Medical_Conditions.

User_Medical_Conditions  Description : Associe les pathologies aux patients.
Champs :user_condition_id (INT, PK) : Identifiant unique.
patient_id (INT, FK → Patients) : Référence au patient.
condition_id (INT, FK → Medical_Conditions) : Référence à la pathologie.
diagnosed_at (DATE) : Date de diagnostic.

Relations : Liée à Patients et Medical_Conditions.

Foods  Description : Base de données des aliments et leurs propriétés nutritionnelles.
Champs :food_id (INT, PK) : Identifiant unique.
name (VARCHAR) : Nom de l'aliment.
calories (FLOAT) : Calories par portion.
protein (FLOAT) : Protéines (g).
carbs (FLOAT) : Glucides (g).
fat (FLOAT) : Lipides (g).
portion_size (FLOAT) : Taille de la portion (g ou ml).
category (VARCHAR) : Catégorie (ex. fruit, légume, viande).

Relations : Liée à Meals.

Meals  Description : Liste des repas prédéfinis.
Champs :meal_id (INT, PK) : Identifiant unique.
name (VARCHAR) : Nom du repas.
description (TEXT) : Description.
is_suitable_for (VARCHAR) : Pathologies compatibles (ex. diabète).

Relations : Liée à Meal_Foods et Nutritional_Plans.

Meal_Foods  Description : Associe les aliments aux repas (relation plusieurs-à-plusieurs).
Champs :meal_food_id (INT, PK) : Identifiant unique.
meal_id (INT, FK → Meals) : Référence au repas.
food_id (INT, FK → Foods) : Référence à l'aliment.
quantity (FLOAT) : Quantité utilisée.

Relations : Liée à Meals et Foods.

Nutritional_Plans  Description : Plans alimentaires générés pour les patients.
Champs :plan_id (INT, PK) : Identifiant unique.
patient_id (INT, FK → Patients) : Référence au patient.
start_date (DATE) : Date de début.
end_date (DATE) : Date de fin.
status (ENUM: 'active', 'completed', 'canceled') : Statut du plan.

Relations : Liée à Plan_Meals et Patients.

Plan_Meals  Description : Associe les repas aux plans alimentaires.
Champs :plan_meal_id (INT, PK) : Identifiant unique.
plan_id (INT, FK → Nutritional_Plans) : Référence au plan.
meal_id (INT, FK → Meals) : Référence au repas.
day (INT) : Jour de la semaine (1 à 7).
meal_type (ENUM: 'breakfast', 'lunch', 'dinner', 'snack') : Type de repas.

Relations : Liée à Nutritional_Plans et Meals.

Master_Classes  Description : Gère les master classes et webinaires.
Champs :class_id (INT, PK) : Identifiant unique.
dietician_id (INT, FK → Dieticians) : Référence au diététicien.
title (VARCHAR) : Titre de la master class.
type (ENUM: 'video', 'webinar') : Type de contenu.
url (VARCHAR) : Lien vers le contenu.
is_premium (BOOLEAN) : Contenu payant ou non.
start_time (DATETIME) : Date et heure de début.
duration (INT) : Durée en minutes.

Relations : Liée à Dieticians et Class_Enrollments.

Class_Enrollments  Description : Gère les inscriptions des utilisateurs aux master classes.
Champs :enrollment_id (INT, PK) : Identifiant unique.
class_id (INT, FK → Master_Classes) : Référence à la master class.
user_id (INT, FK → Users) : Référence à l'utilisateur.
enrolled_at (DATETIME) : Date d'inscription.

Relations : Liée à Master_Classes et Users.

Messages  Description : Gère les échanges entre patients et diététiciens.
Champs :message_id (INT, PK) : Identifiant unique.
sender_id (INT, FK → Users) : Expéditeur.
receiver_id (INT, FK → Users) : Destinataire.
content (TEXT) : Contenu du message.
sent_at (DATETIME) : Date d'envoi.
is_read (BOOLEAN) : Message lu ou non.

Relations : Liée à Users et Message_Attachments.

Message_Attachments  Description : Gère les documents joints aux messages.
Champs :attachment_id (INT, PK) : Identifiant unique.
message_id (INT, FK → Messages) : Référence au message.
file_url (VARCHAR) : Lien vers le fichier.
file_type (VARCHAR) : Type de fichier (ex. PDF, image).

Relations : Liée à Messages.

Appointments  Description : Gère les rendez-vous entre patients et diététiciens.
Champs :appointment_id (INT, PK) : Identifiant unique.
patient_id (INT, FK → Patients) : Référence au patient.
dietician_id (INT, FK → Dieticians) : Référence au diététicien.
appointment_time (DATETIME) : Date et heure.
status (ENUM: 'scheduled', 'completed', 'canceled') : Statut.

Relations : Liée à Patients et Dieticians.

Payments  Description : Gère les transactions de paiement.
Champs :payment_id (INT, PK) : Identifiant unique.
user_id (INT, FK → Users) : Référence à l'utilisateur.
amount (FLOAT) : Montant payé.
payment_method (ENUM: 'mobile_money', 'card', 'bank_transfer') : Moyen de paiement.
payment_date (DATETIME) : Date de paiement.
status (ENUM: 'completed', 'pending', 'failed') : Statut.

Relations : Liée à Users et Subscriptions.

Subscriptions  Description : Gère les abonnements des utilisateurs.
Champs :subscription_id (INT, PK) : Identifiant unique.
user_id (INT, FK → Users) : Référence à l'utilisateur.
plan_type (VARCHAR) : Type d'abonnement (ex. monthly, yearly).
start_date (DATE) : Date de début.
end_date (DATE) : Date de fin.
auto_renew (BOOLEAN) : Renouvellement automatique.

Relations : Liée à Users et Payments.

Consultations  Description : Historique des consultations des patients.
Champs :consultation_id (INT, PK) : Identifiant unique.
patient_id (INT, FK → Patients) : Référence au patient.
dietician_id (INT, FK → Dieticians) : Référence au diététicien.
consultation_date (DATETIME) : Date de la consultation.
notes (TEXT) : Notes ou conseils donnés.

Relations : Liée à Patients et Dieticians.

Analytics  Description : Stocke les données pour l'analyse des tendances et statistiques.
Champs :analytic_id (INT, PK) : Identifiant unique.
patient_id (INT, FK → Patients) : Référence au patient.
metric_type (VARCHAR) : Type de métrique (ex. weight_change, plan_adherence).
value (FLOAT) : Valeur de la métrique.
recorded_at (DATETIME) : Date de l'enregistrement.

Relations : Liée à Patients.


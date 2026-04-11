import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function Confidentialite() {
  return (
    <>
      <Helmet>
        <title>Politique de confidentialité | Miles Optimizer</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="text-sm text-primary hover:underline mb-8 block">← Retour à l'accueil</Link>

        <h1 className="text-3xl font-black text-slate-900 mb-2">Politique de confidentialité</h1>
        <p className="text-slate-500 text-sm mb-10">Dernière mise à jour : avril 2026</p>

        <div className="space-y-8 text-sm text-slate-600 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">1. Données collectées</h2>
            <p>Miles Optimizer collecte uniquement les données strictement nécessaires à son fonctionnement :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Adresse email</strong> — uniquement si vous créez un compte ou vous inscrivez à la liste d'attente Premium. Non obligatoire pour utiliser le service.</li>
              <li><strong>Paramètres de recherche</strong> — origine, destination, dates, cabine — stockés temporairement dans votre navigateur (localStorage) pour l'historique des recherches récentes. Ces données ne quittent jamais votre appareil.</li>
              <li><strong>Quota de recherches</strong> — compteur local (localStorage) réinitialisé chaque jour. Aucune donnée envoyée à nos serveurs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">2. Utilisation des données</h2>
            <p>Votre adresse email est utilisée exclusivement pour :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Vous envoyer le lien de connexion sans mot de passe (magic link)</li>
              <li>Vous envoyer des alertes prix si vous en avez créé</li>
              <li>Vous informer du lancement de la version Premium si vous êtes sur liste d'attente</li>
            </ul>
            <p className="mt-3">Nous ne vendons pas, ne louons pas et ne partageons pas vos données avec des tiers à des fins commerciales.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">3. Durée de conservation</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Comptes utilisateurs : jusqu'à suppression par l'utilisateur ou après 24 mois d'inactivité</li>
              <li>Alertes prix : jusqu'à suppression par l'utilisateur</li>
              <li>Liste d'attente : jusqu'au lancement du service Premium ou sur demande de suppression</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">4. Cookies et traceurs</h2>
            <p>Miles Optimizer n'utilise <strong>aucun cookie publicitaire ou de tracking tiers</strong>.</p>
            <p className="mt-2">Nous n'intégrons ni Google Analytics, ni Facebook Pixel, ni aucun outil de traçage commercial.</p>
            <p className="mt-2">Seul le stockage local (localStorage) est utilisé pour mémoriser vos préférences (quota de recherches, historique local, devise sélectionnée). Ces données restent sur votre appareil.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">5. Sous-traitants</h2>
            <p>Nous faisons appel aux sous-traitants suivants, conformément au RGPD :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Supabase</strong> (Supabase Inc.) — base de données et authentification. Données stockées en Europe (région EU West). <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Politique de confidentialité</a></li>
              <li><strong>Resend</strong> — envoi d'emails transactionnels. <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Politique de confidentialité</a></li>
              <li><strong>Render</strong> — hébergement du service. <a href="https://render.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Politique de confidentialité</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">6. Vos droits (RGPD)</h2>
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Droit d'accès</strong> — connaître les données que nous détenons sur vous</li>
              <li><strong>Droit de rectification</strong> — corriger des données inexactes</li>
              <li><strong>Droit à l'effacement</strong> — supprimer votre compte et toutes vos données</li>
              <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format lisible</li>
              <li><strong>Droit d'opposition</strong> — vous opposer à tout traitement</li>
            </ul>
            <p className="mt-3">Pour exercer ces droits, contactez-nous à : <a href="mailto:privacy@miles-optimizer.com" className="text-primary hover:underline">privacy@miles-optimizer.com</a></p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">7. Contact</h2>
            <p>
              Pour toute question relative à cette politique de confidentialité :<br />
              <a href="mailto:privacy@miles-optimizer.com" className="text-primary hover:underline">privacy@miles-optimizer.com</a>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

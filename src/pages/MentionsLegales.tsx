import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function MentionsLegales() {
  return (
    <>
      <Helmet>
        <title>Mentions légales | Miles Optimizer</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-12 prose prose-slate">
        <Link to="/" className="text-sm text-primary hover:underline mb-8 block">← Retour à l'accueil</Link>

        <h1 className="text-3xl font-black text-slate-900 mb-8">Mentions légales</h1>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-3">Éditeur du site</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            <strong>Miles Optimizer</strong> est un service en ligne de comparaison de vols cash et miles.<br />
            Contact : <a href="mailto:contact@miles-optimizer.com" className="text-primary hover:underline">contact@miles-optimizer.com</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-3">Hébergement</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Ce site est hébergé par <strong>Render</strong> (Render Services, Inc.)<br />
            525 Brannan St, Suite 300, San Francisco, CA 94107, États-Unis<br />
            <a href="https://render.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://render.com</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-3">Propriété intellectuelle</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            L'ensemble du contenu de ce site (textes, calculs, algorithmes, design) est la propriété exclusive de Miles Optimizer.
            Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-3">Données non contractuelles</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Les prix affichés (cash et miles) sont fournis à titre indicatif et ne constituent pas une offre commerciale.
            Miles Optimizer n'est pas un agent de voyage et ne vend pas de billets d'avion.
            Les données sont récupérées via des API tierces (Duffel, Aviasales, Google Flights) et peuvent être inexactes ou indisponibles.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-3">Liens d'affiliation</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Certains liens vers des sites partenaires (Aviasales, compagnies aériennes) peuvent être des liens d'affiliation.
            Miles Optimizer peut percevoir une commission en cas de réservation effectuée via ces liens,
            sans coût supplémentaire pour l'utilisateur.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-3">Contact</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Pour toute question relative au site, contactez-nous à :<br />
            <a href="mailto:contact@miles-optimizer.com" className="text-primary hover:underline">contact@miles-optimizer.com</a>
          </p>
        </section>

        <p className="text-xs text-slate-400 mt-12">Dernière mise à jour : avril 2026</p>
      </div>
    </>
  );
}

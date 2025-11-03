# Layout Components

Ce dossier contient les composants de mise en page pour l'application ScolarFlow.

## Composants

### Layout
Le composant principal qui gère la structure globale de l'application avec sidebar.

**Fonctionnalités :**
- Sidebar responsive (fixe sur desktop, overlay sur mobile)
- Gestion de l'état d'ouverture/fermeture du sidebar
- Layout adaptatif avec padding automatique

### Sidebar
Composant de navigation latérale avec menu principal.

**Fonctionnalités :**
- Navigation principale avec icônes
- État actif basé sur la route courante
- Profil utilisateur en bas du sidebar
- Animations de transition fluides
- Support mobile avec overlay

### Header
Barre de navigation supérieure minimaliste.

**Fonctionnalités :**
- Bouton menu pour mobile
- Barre de recherche
- Notifications
- Menu utilisateur
- Design responsive

## Utilisation

```tsx
import { Layout } from './components/layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Vos routes ici */}
        </Routes>
      </Layout>
    </Router>
  );
}
```

## Responsive Design

- **Mobile (< 1024px)** : Sidebar en overlay avec bouton menu
- **Desktop (≥ 1024px)** : Sidebar fixe avec layout adaptatif

## Personnalisation

Les composants utilisent Tailwind CSS et peuvent être facilement personnalisés en modifiant les classes CSS.

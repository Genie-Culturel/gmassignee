// Generated from the read-only live demo export — do not edit by hand.
// Regenerate: node scripts/gen_demo_from_export.mjs
import { ProcedureFiche, QuizQuestionAdmin } from './database.types';

export const DEMO_LIVE_FICHES: ProcedureFiche[] = [
  {
    "id": "235bdc65-06de-4f44-aafb-20e5de50e234",
    "category": "formation_technique",
    "title": "🚧 Lancement Novasphère",
    "summary": "Lancement du jeu XR Usine de Chandoline (à compléter).",
    "content_steps": [
      {
        "order": 1,
        "text": "🚧 Procédure de lancement XR — à documenter"
      }
    ],
    "is_placeholder": true,
    "tags": [
      "chandoline",
      "lancement"
    ],
    "is_active": false,
    "version": 3,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 10,
    "scope_kind": "games",
    "sub_group": "chandoline",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-usine_chandoline"
    ],
    "created_at": "2026-11-03T10:07:49.180417+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "1b60d09c-3fe3-459d-84d2-10b4f672b4a5",
    "category": "formation_technique",
    "title": "Couvent : mise en route et arrêt de l’énigme",
    "summary": "Allumer, contrôler et armer l'énigme de la grille au Couvent, puis l'éteindre après la partie.",
    "content_steps": [
      {
        "order": 1,
        "text": "Prendre la petite télécommande blanche du beamer (il n'y en a qu'une, ne pas la perdre)."
      },
      {
        "order": 2,
        "text": "Derrière l'harmonium, repérer la prise qui descend du plafond. Si elle est branchée, la débrancher, attendre environ 5 s, puis la rebrancher."
      },
      {
        "order": 3,
        "text": "Allumer IMMÉDIATEMENT le beamer avec la télécommande (un allumage tardif donne une projection trop petite)."
      },
      {
        "order": 4,
        "text": "Sur la tablette ou le téléphone GM, se connecter au Wi-Fi COUVENT-GM (QR code de connexion fourni avec le manuel), puis ouvrir 10.10.0.1 dans le navigateur. « Aucune connexion Internet » est normal."
      },
      {
        "order": 5,
        "text": "Debug → Capteurs / Arduinos : GPIO PIR initialisé en vert, A1 à A4 « Connecté » en vert, les 16 « Capteur répond » en vert. Les « Objet détecté » rouges sont normaux. Revenir avec BACK TO CONTROL."
      },
      {
        "order": 6,
        "text": "Test : appuyer sur ARM, passer devant le capteur vers l'escalier, vérifier que la vidéo d'intro démarre à la bonne taille, puis appuyer sur RESET."
      },
      {
        "order": 7,
        "text": "Se placer dans l'escalier (hors zone de détection) et appuyer de nouveau sur ARM : le jeu est prêt."
      },
      {
        "order": 8,
        "text": "Pendant la partie : READY → ARMED → INTRO PLAYING (environ 1 min) → GRID ACTIVE → FINAL PLAYING. Le GM n'intervient que si besoin (fiche « Dépannage : Couvent »)."
      },
      {
        "order": 9,
        "text": "Après la partie : éteindre le beamer (2 pressions sur le bouton d'extinction), attendre l'extinction complète, puis débrancher la prise derrière l'harmonium."
      },
      {
        "order": 10,
        "text": "Ne jamais toucher au câblage des Arduino."
      }
    ],
    "is_placeholder": true,
    "tags": [
      "couvent",
      "davinci",
      "technique"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 10,
    "scope_kind": "all",
    "sub_group": "escape_sion",
    "scope_location_ids": [],
    "scope_game_ids": [],
    "created_at": "2026-11-03T14:03:18.899438+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "455b8c87-dc3f-4632-8e6f-b82c40390bf7",
    "category": "formation_technique",
    "title": "Setup Quest",
    "summary": "Préparer et réveiller les casques Quest via Génie Deploy jusqu’à ce qu’ils soient tous en Air Link (verts).",
    "content_steps": [
      {
        "order": 1,
        "text": "Allumer le mini PC et ouvrir Génie Deploy."
      },
      {
        "order": 2,
        "text": "Réveiller tous les casques Quest à la main (bouton standby / allumage)."
      },
      {
        "order": 3,
        "text": "Réveiller (Wake) les PC qui seront utilisés. Attention : les PC GM-A, GM-B et GM-AUX doivent être allumés manuellement avec l'interrupteur du PC."
      },
      {
        "order": 4,
        "text": "Dans Génie Deploy, lancer « Run restart setup » sur les Quest utilisés."
      },
      {
        "order": 5,
        "text": "Si un Quest est rouge : vérifier qu'il est bien présent et allumé."
      },
      {
        "order": 6,
        "text": "Pendant le scanning de la boundary (tentatives 1, 2, 3) : \nprendre le Quest en main, regarder le sol et bouger si nécessaire le temps qu'il valide la boundary.\nSi le Quest redémarre, la procédure a réussi."
      },
      {
        "order": 7,
        "text": "Si c'est bloqué sur la boundary ou qu'il demande « stationary » : \nfaire la boundary manuellement et attendre le redémarrage.\nAttention : il faut être dans la boundary et y rester pour qu'il continue la procédure."
      },
      {
        "order": 8,
        "text": "Attendre jusqu'à ce que tous les Quest soient redémarrés après la procédure et en Air Link et tous verts."
      },
      {
        "order": 9,
        "text": "Si le problème persiste : relancer un run complet du setup."
      },
      {
        "order": 10,
        "text": "Conseil : toujours préparer le maximum de Quest possible ; en cas de problème, ils seront prêts pour jouer."
      },
      {
        "order": 11,
        "text": "Après une partie : refaire « Run restart setup » pour chaque Quest joué."
      },
      {
        "order": 12,
        "text": "Si vous utilisez GM-B GM-B AUX ou  GM-A GM-A AUX:\nrefaire impérativement un restart complet du PC."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "matériel",
      "casques",
      "rh_vr_circuit",
      "Quest 3"
    ],
    "is_active": true,
    "version": 15,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 10,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:13.863281+00:00",
    "updated_at": "2026-11-10T16:10:30.927493+00:00"
  },
  {
    "id": "57d0cfd8-9991-444d-a8c1-96a4d4386f30",
    "category": "formation_technique",
    "title": "Setup Game",
    "summary": "Choisir le bon PC, vérifier mises à jour et batteries, puis lancer le jeu (GM puis joueurs) via Génie Deploy et contrôler chaque joueur.",
    "content_steps": [
      {
        "order": 1,
        "text": "Vérifier que le Setup Quest est terminé : tous les Quest sont en Air Link et verts."
      },
      {
        "order": 2,
        "text": "Dans Génie Deploy, sélectionner le bon jeu dans Game (HEP = SchoolCrafter)."
      },
      {
        "order": 3,
        "text": "Choisir le PC qui fera tourner le jeu.\nPartie à 7 ou 8 joueurs : le jeu tourne sur un PC auxiliaire (salle A = GM-A ou Aux, salle B = GM-B ou Aux). Moins de 7 joueurs : A8 ou B8. \n! Avant la partie, faire impérativement un restart du PC GM-A, GM-B ou AUX utilisé !"
      },
      {
        "order": 4,
        "text": "Démarrer le remote des connexions (A8, B8, GM-A…)."
      },
      {
        "order": 5,
        "text": "Ouvrir Splashtop pour avoir l'accès à distance aux PC, et ouvrir les PC qui seront utilisés.\n! Attention - Réduire la ou les fenêtres Splashtop quand le jeu est lancé : cela améliore les performances et réduit les problèmes !"
      },
      {
        "order": 6,
        "text": "Dans Meta Link > Library : contrôler s'il y a une mise à jour à faire ; si oui, la faire."
      },
      {
        "order": 7,
        "text": "Dans Meta Link > Devices : contrôler la charge des Quest et des batteries. Batterie faible ou plusieurs parties à la suite : mettre des batteries. Penser à gérer la charge des batteries."
      },
      {
        "order": 8,
        "text": "Retour sur le mini PC (Génie Deploy) : sélectionner le PC qui héberge la session GM et appuyer sur « Launch selected game »."
      },
      {
        "order": 9,
        "text": "Retourner sur le PC GM (par exemple B8) et attendre le démarrage du jeu."
      },
      {
        "order": 10,
        "text": "Une fois le jeu démarré : retour sur Génie Deploy, sélectionner les PC joueurs et « Launch selected game ».\n! Ne pas relancer le jeu sur le PC host qui tourne déjà !"
      },
      {
        "order": 11,
        "text": "Retour sur le remote : contrôler la connexion de tous les joueurs et leur bon placement."
      },
      {
        "order": 12,
        "text": "Vérifier la hauteur de chaque joueur un par un en prenant le Quest, et régler en même temps le volume aux 2/3 (possible aussi depuis le moniteur Splashtop)."
      },
      {
        "order": 13,
        "text": "Pour fermer les jeux : « Quit Game » sur Génie Deploy.\nAttention à bien quitter sur tous les PC."
      },
      {
        "order": 14,
        "text": "Avant une nouvelle partie partie : refaire IMPERATIVEMENT « Run restart setup  » pour chaque Quest joué."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "matériel",
      "casques",
      "rh_vr_circuit",
      "Quest 3"
    ],
    "is_active": true,
    "version": 9,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 20,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-04T13:44:01.914608+00:00",
    "updated_at": "2026-11-10T16:10:34.324405+00:00"
  },
  {
    "id": "8ec361ea-14d2-4233-a8e9-1ed0ed675e05",
    "category": "formation_technique",
    "title": "Recharge des casques et manettes",
    "summary": "Comment recharger les casques Quest 3 et les manettes",
    "content_steps": [
      {
        "order": 1,
        "text": "Vérifier le niveau des batteries des Quest et des manettes dans Meta Horizon Link."
      },
      {
        "order": 2,
        "text": "À la fin d'un jeu, mettre impérativement les Quest en charge le plus rapidement possible, avant d'accompagner les clients au lobby ou ailleurs."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "matériel",
      "recharge",
      "rh_vr_circuit",
      "Quest 3"
    ],
    "is_active": true,
    "version": 3,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 30,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:13.863281+00:00",
    "updated_at": "2026-11-10T16:10:37.250943+00:00"
  },
  {
    "id": "85467012-85d5-43d3-b51d-2e9a08d49c32",
    "category": "formation_technique",
    "title": "Nettoyage casques et manettes entre groupes",
    "summary": "Nettoyage rapide entre deux groupes (obligatoire)",
    "content_steps": [
      {
        "order": 1,
        "text": "Produit et chiffon à utiliser : pate propre et produit pour bébé en cuisine"
      },
      {
        "order": 2,
        "text": "Nettoyer les mousses de contact des casques entre chaque groupes"
      },
      {
        "order": 3,
        "text": "Nettoyer les lentilles avec le chiffon microfibre uniquement"
      },
      {
        "order": 4,
        "text": "Nettoyer les poignées des manettes"
      },
      {
        "order": 5,
        "text": "Vérifier visuellement l'état du matériel"
      }
    ],
    "is_placeholder": false,
    "tags": [
      "rh_nettoyage",
      "matériel",
      "nettoyage",
      "rh_vr_circuit",
      "hygiène"
    ],
    "is_active": true,
    "version": 3,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 40,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center",
      "loc-nettoyage_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:13.863281+00:00",
    "updated_at": "2026-11-10T16:10:37.251665+00:00"
  },
  {
    "id": "e3592ebe-26a8-41d6-ab1a-6c629099f883",
    "category": "formation_technique",
    "title": "Lancement du Serviteur I - II & Saga",
    "summary": "Comment lancer Le Serviteur de la Rédemption : Chapitre I, Chapitre II et la Saga",
    "content_steps": [
      {
        "order": 1,
        "text": "Dans Génie Deploy, sélectionner le bon jeu (voir les fiches Setup Quest et Setup Game)."
      },
      {
        "order": 2,
        "text": "Démarrer le jeu uniquement sur le PC GM host, puis attendre que le jeu soit lancé et connecté."
      },
      {
        "order": 3,
        "text": "Ensuite, sélectionner les PC clients voulus et cliquer sur « Launch selected game »."
      },
      {
        "order": 4,
        "text": "Revenir sur le PC GM et surveiller la connexion de tous les clients (joueurs).\nTous les clients doivent être parfaitement alignés et à leur bon emplacement.\nIl est possible qu'un avatar sans nom apparaisse : c'est le GM. Pas de problème, personne ne le verra.\n\nEn cas d'erreur ou d'anomalie (par exemple : clients connectés mais pas au bon endroit, clients connectés mais pas à la bonne taille, ou autre problème), se référer aux procédures de dépannage."
      },
      {
        "order": 5,
        "text": "Une fois tout en place et après avoir équipé les clients, demander aux joueurs de se positionner dans un rond rouge et de mettre les mains le long du corps."
      },
      {
        "order": 6,
        "text": "Dans Gameplay, il y a tous les raccourcis et boutons d'action utiles à chaque scène. Les actions Gameplay évoluent en fonction des chapitres.\n! Bien lire les actions avant de les déclencher !"
      },
      {
        "order": 7,
        "text": "Commencer la partie : dans Session, charger (LOAD) :\n- Serviteur 1 : 01 chap_1_intro\n- Serviteur 2 : 06 Chap2_1_intro2"
      },
      {
        "order": 8,
        "text": "Saga :\nPour une Saga (Serviteur 1 + 2), ne pas quitter le jeu sur le PC GM host, même pendant la pause. Cela évite aux clients de refaire le tuto.\nLes joueurs peuvent être déconnectés et reconnectés à ce moment-là (par exemple pour refaire le clear des Quest) : rien ne changera."
      },
      {
        "order": 9,
        "text": "Pendant le tuto, assister les joueurs pour qu'ils progressent.\nContrôler à cette étape que tout va bien pour tout le monde : chacun arrive à utiliser le clavier, à attraper (grab) les objets…"
      },
      {
        "order": 10,
        "text": "Indiquer aux joueurs de toujours suivre les position markers (ronds rouges au sol) pour évoluer dans le jeu."
      },
      {
        "order": 11,
        "text": "Dans la section Players, vous avez les infos des joueurs. Changer la langue si un joueur s'est trompé.\nIl y a aussi des réglages de debug : Calibrer, Local anchor, Cloud anchor.\nSi un joueur est décalé, actionner ces trois boutons pour le recalibrer.\nLe bouton Anchor UI ne doit jamais être actionné sans suivre la procédure de création d'ancre locale (debug niveau expérimenté, ne pas effectuer sans l'aval d'un dev, dernier recours)."
      },
      {
        "order": 12,
        "text": "Si un objet a disparu ou si les position markers ne fonctionnent pas correctement, il y a des boutons pour faire réapparaître (respawn) les éléments ou activer les PM : bien vérifier dans Gameplay."
      },
      {
        "order": 13,
        "text": "Cam/UI : réglage de la taille de l'UI et de la vitesse de la caméra."
      },
      {
        "order": 14,
        "text": "En cas de crash ou de problème, ou simplement si un joueur veut arrêter l'immersion, un bouton Eject est disponible pour chaque joueur dans Players."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "Serviteur",
      "jeu",
      "lancement"
    ],
    "is_active": true,
    "version": 9,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 50,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-serviteur",
      "game-saga"
    ],
    "created_at": "2026-11-02T13:04:13.863281+00:00",
    "updated_at": "2026-11-10T18:06:16.492375+00:00"
  },
  {
    "id": "b8e8c72b-9587-4195-9d39-41cafde8f8b7",
    "category": "formation_technique",
    "title": "Lancement de la Bataille de la Planta",
    "summary": "Comment lancer le jeu La Bataille de la Planta.",
    "content_steps": [
      {
        "order": 1,
        "text": "Dans Génie Deploy, sélectionner le bon jeu (voir les fiches Setup Quest et Setup Game)."
      },
      {
        "order": 2,
        "text": "Démarrer le jeu uniquement sur le PC GM host, puis attendre que le jeu soit lancé et connecté."
      },
      {
        "order": 3,
        "text": "Ensuite, sélectionner les PC clients voulus et cliquer sur « Launch selected game »."
      },
      {
        "order": 4,
        "text": "Revenir sur le PC GM et surveiller la connexion de tous les clients (joueurs).\nTous les clients doivent être parfaitement alignés et à leur bon emplacement.\n\nDans la Bataille de la Planta, les avatars doivent être alignés sur la paroi EST de l'entrée de la tente.\n\nEn cas d'erreur ou d'anomalie (par exemple : clients connectés mais pas au bon endroit, clients connectés mais pas à la bonne taille ou autre problème), se référer aux procédures de dépannage."
      },
      {
        "order": 5,
        "text": "Une fois tout en place et après avoir équipé les clients, demander aux joueurs de se positionner dans un rond rouge et de commencer le setup de leur avatar.\n\nAutoriser le déplacement des joueurs dans la tente seulement quand tous les clients sont OK : si un joueur finit le tuto et qu'un autre ne l'a pas commencé, il ne sera pas considéré dans le jeu et ne sera pas pris en compte pour les markers (emplacement où les joueurs doivent se placer pour passer à l'étape suivante)."
      },
      {
        "order": 6,
        "text": "Pour déplacer la caméra (vue du GM) :\nSélectionner le bouton CAM, ce qui ouvre le menu en bas à droite.\nDans ce menu, sélectionner le bouton LIBRE pour pouvoir se déplacer avec la souris et les touches.\nCe menu est aussi utilisé pour changer de lieu pour la caméra dans le jeu : PlayAera_Marjorie ; tower_Top ..."
      },
      {
        "order": 7,
        "text": "Dans le menu SETUP se trouvent des données de connexion et de débogage.\nATTENTION : ne PAS commencer le jeu avec le bouton \"Démarrer la bataille\" ici en vert ! Ce bouton est destiné à la démonstration et va téléporter tous les joueurs directement dans la bataille sans faire de tuto."
      },
      {
        "order": 8,
        "text": "Pour commencer une partie normalement, utiliser le bouton START tuto dans l'onglet TUTO."
      },
      {
        "order": 9,
        "text": "Dans le bouton PLAYER se trouvent toutes les informations concernant les clients connectés.\nTaille et rig servent à ajuster la grandeur du client. Bug possible : les mains d'un joueur peuvent apparaître énormes (mains de géant). Dans ce cas, appuyer sur le bouton Rig ou Taille.\nAnchor et Align servent à repositionner le client en cas de désalignement."
      },
      {
        "order": 10,
        "text": "Le Wave manager est utilisé pour consulter les informations sur la bataille en cours. La bataille est découpée en plusieurs vagues d'arrivée d'ennemis. Au bout d'un certain temps ou si les joueurs ont tué tous les ennemis présents, une nouvelle vague commence.\nLe GM a la possibilité d'intervenir pour rendre le jeu plus difficile (en ajoutant des attaquants : +1 warriors - +5 archer…), ou d'aider les joueurs en ajoutant des archers alliés (+1  - +5 archer alliers)."
      },
      {
        "order": 11,
        "text": "Dans le wave manager, il est possible de respawn les armes si les clients n'en ont plus ou s'il y a des problèmes avec les armes."
      },
      {
        "order": 12,
        "text": "Avant la dernière vague, les joueurs sont automatiquement téléportés au bas de la tour pour une ultime attaque. À ce stade, il reste environ 8 minutes de jeu."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "Planta",
      "jeu",
      "lancement"
    ],
    "is_active": true,
    "version": 4,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 80,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [
      "game-planta"
    ],
    "created_at": "2026-11-02T13:04:13.863281+00:00",
    "updated_at": "2026-11-10T21:55:38.850659+00:00"
  },
  {
    "id": "e99a5099-509a-417b-bfc1-def9778c587f",
    "category": "formation_technique",
    "title": "Lancement de Schoolcrafter",
    "summary": "Lancement de Schoolcrafter",
    "content_steps": [
      {
        "order": 1,
        "text": "Dans Génie Deploy, sélectionner le bon jeu (voir les fiches Setup Quest et Setup Game)."
      },
      {
        "order": 2,
        "text": "Démarrer le jeu uniquement sur le PC GM host, puis attendre que le jeu soit lancé et connecté."
      },
      {
        "order": 3,
        "text": "Sélectionner les PC clients voulus et cliquer sur « Launch selected game »."
      },
      {
        "order": 4,
        "text": "Revenir sur le PC GM et surveiller la connexion de tous les clients (joueurs).\nTous les clients doivent être parfaitement alignés et à leur bon emplacement.\nIl est possible qu'un avatar donne l'impression de clignoter ; prendre le casque en main et contrôler dans le Quest si tout est normal. Si c'est le cas, ne rien entreprendre de plus.\n\nEn cas d'erreur ou d'anomalie (par exemple : clients connectés mais pas au bon endroit, clients connectés mais pas à la bonne taille, ou autre problème), se référer aux procédures de dépannage."
      },
      {
        "order": 5,
        "text": "Une fois tout en place et après avoir équipé les clients, demander aux joueurs de se positionner dans un rond bleu.\nPour commencer le jeu, utiliser le bouton START GAME dans l'onglet Session."
      },
      {
        "order": 6,
        "text": "L'onglet Session contient les informations de connexion, le bouton START et des raccourcis pour se rendre directement dans un univers au choix (pour des démos ou du débogage)."
      },
      {
        "order": 7,
        "text": "L'onglet Player contient toutes les informations concernant les joueurs.\nDans ce module, vous pouvez renommer un joueur, changer sa langue de jeu ou l'éjecter du jeu."
      },
      {
        "order": 8,
        "text": "L'onglet Timer aide le GM à situer l'évolution de la partie. Le Timer est réglé pour une heure de jeu. Il fait une simulation pour déterminer si les joueurs sont en avance ou en retard, en fonction des étapes restantes dans le jeu."
      },
      {
        "order": 9,
        "text": "Dans chaque partie du jeu, un nouvel onglet s'affiche. Il contient tous les éléments, les raccourcis, l'aide et le débogage utiles à la scène jouée."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "Serviteur",
      "jeu",
      "lancement"
    ],
    "is_active": true,
    "version": 6,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 90,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [
      "game-schoolcrafter"
    ],
    "created_at": "2026-11-04T11:00:47.96138+00:00",
    "updated_at": "2026-11-10T23:15:32.862912+00:00"
  },
  {
    "id": "bba97904-4fe1-4dde-be16-d8c34ff41ca7",
    "category": "formation_technique",
    "title": "Procédure incident - malaise ",
    "summary": "Que faire si un client se sent mal (nausée, vertige, malaise)",
    "content_steps": [
      {
        "order": 1,
        "text": "Retirer immédiatement le casque du client"
      },
      {
        "order": 2,
        "text": "L'accompagner s'asseoir dans un endroit calme"
      },
      {
        "order": 3,
        "text": "Lui proposer de l'eau"
      },
      {
        "order": 4,
        "text": "Attendre que le client se sente mieux avant de reprendre si envie/possible"
      },
      {
        "order": 5,
        "text": "Si le malaise persiste, arrêter la session et contacter un responsable ou urgence si gros malaise ou problème cardiaque"
      },
      {
        "order": 6,
        "text": "Noter l'incident et tout se qui a été fait détailler à la minutes dans la session"
      }
    ],
    "is_placeholder": false,
    "tags": [
      "malaise",
      "sécurité",
      "incident",
      "rh_vr_circuit"
    ],
    "is_active": true,
    "version": 7,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 100,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:13.863281+00:00",
    "updated_at": "2026-11-10T16:13:52.195525+00:00"
  },
  {
    "id": "64f5e2a4-704b-4258-8a8b-8d20f0ecf1be",
    "category": "procedure_deroulement",
    "title": "Accueil Usine de Chandoline",
    "summary": "Accueil des visiteurs à l'Usine de Chandoline (à compléter).",
    "content_steps": [
      {
        "order": 1,
        "text": "🚧 Accueil et briefing XR — à documenter"
      }
    ],
    "is_placeholder": true,
    "tags": [
      "chandoline",
      "accueil"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 10,
    "scope_kind": "locations",
    "sub_group": "chandoline",
    "scope_location_ids": [
      "loc-chandoline"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-03T10:07:49.180417+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "cbad4e09-98e1-4bd2-a5c4-62eebf1c8740",
    "category": "procedure_deroulement",
    "title": "Briefing Feux sacrés",
    "summary": "Briefing du jeu extérieur Feux sacrés à Escape Life Sierre (à compléter).",
    "content_steps": [
      {
        "order": 1,
        "text": "🚧 Briefing Feux sacrés — à documenter"
      }
    ],
    "is_placeholder": true,
    "tags": [
      "feux-sacres",
      "sierre"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 10,
    "scope_kind": "games",
    "sub_group": "escape_sierre",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-feux_sacres"
    ],
    "created_at": "2026-11-03T10:07:49.180417+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "9ce5bf55-fe82-48c9-b280-45fdff5d258e",
    "category": "procedure_deroulement",
    "title": "Escape Life : avant le jeu (réservation, stock, matériel)",
    "summary": "Lire la réservation, arriver au stock à temps et prendre le bon matériel.",
    "content_steps": [
      {
        "order": 1,
        "text": "Au plus tard la veille, lire les infos du jeu dans GMassignee : nombre de participants, option « jouer en 1 équipe », langue d'animation (FR, EN ou DE), autres options et packages, notes de l'administration."
      },
      {
        "order": 2,
        "text": "Arriver au lieu de stockage du matériel entre 45 min et 1 h avant l'heure de la réservation."
      },
      {
        "order": 3,
        "text": "Prendre les éléments du jeu dans la langue demandée par le client."
      },
      {
        "order": 4,
        "text": "Prendre un sac par équipe."
      },
      {
        "order": 5,
        "text": "Prendre le téléphone d'animation et les clés."
      },
      {
        "order": 6,
        "text": "Si l'option Vinum (ou vin) est prise : prendre aussi verres, bouteilles, cadenas pour les bouteilles, porte-verres et tire-bouchons, en respectant les quantités (voir la fiche « Vinum : matériel et quantités de vin »)."
      }
    ],
    "is_placeholder": true,
    "tags": [
      "escape-life",
      "preparation"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 10,
    "scope_kind": "locations",
    "sub_group": "escape_life",
    "scope_location_ids": [
      "loc-escape_sion",
      "loc-escape_sierre"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-03T14:03:18.899438+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "1cd80c4d-071c-4d4c-88a8-d94ea0aa1609",
    "category": "procedure_deroulement",
    "title": "Règles générales GM",
    "summary": "Règles communes à tous les lieux (à compléter).",
    "content_steps": [
      {
        "order": 1,
        "text": "Être à l'heure : arriver à l'heure convenue, adaptée au jeu à animer (voir la procédure de chaque jeu)."
      },
      {
        "order": 2,
        "text": "En cas de retard (même léger) ou d'imprévu grave, prévenir le responsable le plus rapidement possible et obtenir confirmation : ne pas se contenter d'un message."
      },
      {
        "order": 3,
        "text": "Avoir une tenue propre et soignée."
      },
      {
        "order": 4,
        "text": "Sourire et bonne humeur : accueillir chaque groupe avec énergie et bienveillance, c'est le début de l'expérience."
      },
      {
        "order": 5,
        "text": "Le client passe en premier : rester disponible, à l'écoute et anticiper ses besoins."
      },
      {
        "order": 6,
        "text": "Rester poli, calme et patient, même avec des clients difficiles. En cas de conflit, ne pas s'énerver et appeler le responsable."
      },
      {
        "order": 7,
        "text": "Ranger son téléphone personnel pendant les jeux (sauf pour prendre les vidéos des clients) et consacrer son temps uniquement à la session de jeu en cours.\nLes temps libres doivent être utilisés pour améliorer l'expérience client ou pour le nettoyage général."
      },
      {
        "order": 8,
        "text": "Connaître parfaitement le jeu et le déroulement de la session. En cas de doute, se documenter ou demander une formation au responsable."
      },
      {
        "order": 9,
        "text": "La sécurité avant tout : surveiller les joueurs pendant toute la partie et ne jamais les laisser sans surveillance."
      },
      {
        "order": 10,
        "text": "Prendre soin du matériel (casques, manettes, cadenas, etc.) et signaler immédiatement toute casse ou panne."
      },
      {
        "order": 11,
        "text": "Laisser les lieux propres et rangés après chaque session."
      },
      {
        "order": 12,
        "text": "Communiquer avec l'équipe : transmettre les infos importantes (problème technique, remarque d'un client, stock qui manque)."
      },
      {
        "order": 13,
        "text": "Respecter la vie privée des clients : pas de photos ni d'informations partagées en dehors du cadre prévu."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "general",
      "tous-lieux"
    ],
    "is_active": true,
    "version": 10,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 10,
    "scope_kind": "all",
    "sub_group": null,
    "scope_location_ids": [],
    "scope_game_ids": [],
    "created_at": "2026-11-03T10:07:49.180417+00:00",
    "updated_at": "2026-11-11T00:03:56.552048+00:00"
  },
  {
    "id": "613c1366-39b9-4485-a3b0-6df30dcfd2df",
    "category": "procedure_deroulement",
    "title": "Setup du lobby",
    "summary": "Préparer le lobby, le salon et le bar avant l'arrivée des premiers clients.",
    "content_steps": [
      {
        "order": 1,
        "text": "Ouvrir la porte d'entrée du bâtiment au moins 15 minutes avant l'arrivée des premiers clients, et la bloquer avec la cale en bois."
      },
      {
        "order": 2,
        "text": "Préparation de l'accueil : allumer les lumières, sans oublier celle du réfrigérateur des boissons clients, le spot derrière la machine à pop-corn et celui au-dessus de la zone démo."
      },
      {
        "order": 3,
        "text": "Allumer la musique d'ambiance. C'est important : elle doit tourner avant l'arrivée des clients, également dans le salon !"
      },
      {
        "order": 4,
        "text": "Allumer la TV du salon et mettre en route le diaporama sur la clé USB."
      },
      {
        "order": 5,
        "text": "Préparer une feuille de consommation des boissons avec un stylo sur la table (salon ou lobby)."
      },
      {
        "order": 6,
        "text": "Contrôler l'état de rangement et de propreté des espaces d'accueil, du salon, des WC et des salles, et faire le nécessaire en cas de besoin."
      },
      {
        "order": 7,
        "text": "Contrôle des stocks : boissons dans le réfrigérateur ; papier toilette ; serviettes en papier pour les mains dans les WC."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "lobby",
      "ouverture",
      "setup",
      "rh_vr_circuit",
      "bar"
    ],
    "is_active": true,
    "version": 12,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 10,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-03T17:55:20.385009+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "9976312d-9c18-4ab8-a5df-ff69d6955d91",
    "category": "procedure_deroulement",
    "title": "Vinum : matériel et quantités de vin",
    "summary": "Option Vinum : quoi prendre, quelles quantités servir et comment ranger verres et bouteilles.",
    "content_steps": [
      {
        "order": 1,
        "text": "Matériel à prendre au stock : verres, bouteilles de vin, cadenas pour les bouteilles, porte-verres, tire-bouchons."
      },
      {
        "order": 2,
        "text": "Vinum 1 ou 2 équipes : 1 vin rouge et 1 vin blanc (75 cl) par équipe."
      },
      {
        "order": 3,
        "text": "Vinum 3 équipes : 1 vin blanc uniquement par équipe."
      },
      {
        "order": 4,
        "text": "Équipe de 7 personnes ou plus : doubler sa quantité de vin. Exemple : 1 équipe de 10 personnes = 2 blancs et 2 rouges."
      },
      {
        "order": 5,
        "text": "Respecter ces quantités : les abus sont retenus sur le salaire et le stock est sous vidéosurveillance."
      },
      {
        "order": 6,
        "text": "Après le jeu : jeter les bouteilles sur le chemin du lieu final à la cave, sauf entre 21 h et 7 h ou entre 12 h et 13 h. Dans ce cas, les mettre dans le bac de recyclage du verre à la cave."
      },
      {
        "order": 7,
        "text": "Séparer les verres sales des verres propres et les ranger aux emplacements étiquetés."
      }
    ],
    "is_placeholder": true,
    "tags": [
      "vinum",
      "davinci",
      "option"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 10,
    "scope_kind": "games",
    "sub_group": "escape_sion",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-davinci"
    ],
    "created_at": "2026-11-03T14:03:18.899438+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "c34d946f-06bc-403e-8cd6-9a24b3b65cfc",
    "category": "procedure_deroulement",
    "title": "🚧 Procédure Novasphère (à compléter)",
    "summary": "Déroulement d'une partie Novasphère à l'Usine de Chandoline (en cours d'élaboration).",
    "content_steps": [
      {
        "order": 1,
        "text": "🚧 Procédure en cours d'élaboration — à compléter"
      }
    ],
    "is_placeholder": true,
    "tags": [
      "novasphere",
      "chandoline"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 20,
    "scope_kind": "games",
    "sub_group": "chandoline",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-usine_chandoline"
    ],
    "created_at": "2026-11-03T13:48:21.506301+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "a7d894cd-ae8d-4615-9309-ed9f768df9c0",
    "category": "procedure_deroulement",
    "title": "Briefing Davinci",
    "summary": "Briefing du jeu extérieur Davinci à Escape Life Sion (à compléter).",
    "content_steps": [
      {
        "order": 1,
        "text": "🚧 Briefing Davinci — à documenter"
      }
    ],
    "is_placeholder": true,
    "tags": [
      "davinci",
      "sion"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 20,
    "scope_kind": "games",
    "sub_group": "escape_sion",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-davinci"
    ],
    "created_at": "2026-11-03T10:07:49.180417+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "6fd18e21-e981-4678-8aca-72ac5b737ef7",
    "category": "procedure_deroulement",
    "title": "Escape Life : préparer les étapes du jeu",
    "summary": "Préparer chaque lieu du parcours avant l'arrivée des joueurs.",
    "content_steps": [
      {
        "order": 1,
        "text": "Laisser un sac pour les clients à la 1re étape de l'équipe."
      },
      {
        "order": 2,
        "text": "Allumer la lumière."
      },
      {
        "order": 3,
        "text": "Mettre en place une partie des éléments du jeu."
      },
      {
        "order": 4,
        "text": "Vérifier les cadenas et les verrouiller."
      },
      {
        "order": 5,
        "text": "Brancher les appareils électriques et vérifier qu'ils fonctionnent."
      },
      {
        "order": 6,
        "text": "Vérifier qu'il y a tous les éléments nécessaires pour faire les énigmes de cette étape."
      },
      {
        "order": 7,
        "text": "Le Feu sacré : préparer d'abord la Cave des Vidômes, puis le Château Villa (voir la fiche « Le Feu sacré : processus GM et rendez-vous »)."
      }
    ],
    "is_placeholder": true,
    "tags": [
      "escape-life",
      "preparation"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 20,
    "scope_kind": "locations",
    "sub_group": "escape_life",
    "scope_location_ids": [
      "loc-escape_sierre",
      "loc-escape_sion"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-03T14:03:18.899438+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "d4b8e920-874f-447a-a627-720486e390b4",
    "category": "procedure_deroulement",
    "title": "Le Feu sacré : processus GM et rendez-vous",
    "summary": "Ordre des tâches de l'animateur, lieux de rendez-vous et temps par étape selon le nombre d'équipes.",
    "content_steps": [
      {
        "order": 1,
        "text": "1 équipe : préparer la Cave des Vidômes → préparer le Château Villa → début du jeu → ranger la Cave des Vidômes → faire la fin au Château Villa → ranger le Château Villa → ramener les médaillons à la Cave des Vidômes."
      },
      {
        "order": 2,
        "text": "Rendez-vous (1 équipe) : Rue du Bourg 24, 3960 Sierre, devant le Château des Vidômes."
      },
      {
        "order": 3,
        "text": "Temps par étape (1 équipe) : Cave des Vidômes 60 min, église Notre-Dame-des-Marais 10 min, Mercier 40 min, Villa + final 20 min."
      },
      {
        "order": 4,
        "text": "2 équipes (1 animateur) : préparer la Cave → préparer la Villa → début → ranger la Villa → ranger la Cave → fin au Café → ranger la Villa → ranger la Cave. 2e rendez-vous : Rue Sainte-Catherine 4, devant le Château Villa. Une étape Joker (10 min) s'ajoute ; final au Café (10 min)."
      },
      {
        "order": 5,
        "text": "3 équipes (2 animateurs) : animateur 1 prépare la Cave, début, range la Cave ×3, fait la fin au Café, aide à ranger la Cave ; animateur 2 prépare la Villa, début, range la Villa ×3. 3e rendez-vous : Chemin des Cyprès, parking du Château Mercier."
      }
    ],
    "is_placeholder": true,
    "tags": [
      "feu-sacre",
      "sierre",
      "processus"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 20,
    "scope_kind": "games",
    "sub_group": "escape_sierre",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-feux_sacres"
    ],
    "created_at": "2026-11-03T14:03:18.899438+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "132e6859-dc33-4d04-b5f8-87cc844c4f82",
    "category": "procedure_deroulement",
    "title": "Préparer la salle",
    "summary": "Choisir la halle de jeu (A de préférence) et la préparer avant l'arrivée des clients.",
    "content_steps": [
      {
        "order": 1,
        "text": "Déterminer dans quelle halle le jeu aura lieu : salle A ou salle B. Privilégier la salle A."
      },
      {
        "order": 2,
        "text": "Allumer les lumières de la halle."
      },
      {
        "order": 3,
        "text": "Fermer les fenêtres et portes."
      },
      {
        "order": 4,
        "text": "Allumer le mini PC."
      },
      {
        "order": 5,
        "text": "Allumer les casques."
      },
      {
        "order": 6,
        "text": "Lancer les procédures techniques : Setup Quest, puis Setup Game (voir les fiches ci-dessous)."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "préparation",
      "halle",
      "rh_vr_circuit"
    ],
    "is_active": true,
    "version": 6,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 20,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-04T10:01:13.434421+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "67d8536d-0bfc-430c-bb6f-0769c21ad61d",
    "category": "procedure_deroulement",
    "title": "🚧 Novasphère : sécurité sur site (à compléter)",
    "summary": "Consignes de sécurité propres à l'usine (zones, commandes) : à compléter.",
    "content_steps": [
      {
        "order": 1,
        "text": "🚧 Aucune procédure documentée pour l'instant — à compléter (zones autorisées, commandes réelles, consignes aux joueurs)."
      }
    ],
    "is_placeholder": true,
    "tags": [
      "novasphere",
      "chandoline",
      "securite"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 30,
    "scope_kind": "locations",
    "sub_group": "chandoline",
    "scope_location_ids": [
      "loc-chandoline"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-03T14:03:18.899438+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "6abd223c-d911-4f38-8e30-196b9e5b8d1e",
    "category": "procedure_deroulement",
    "title": "Escape Life : animation sur 4DGames et suivi des équipes",
    "summary": "Animer la partie depuis le téléphone d'animation et garder le contact avec chaque équipe.",
    "content_steps": [
      {
        "order": 1,
        "text": "L'animation se fait sur 4dgames.ch avec le téléphone d'animation."
      },
      {
        "order": 2,
        "text": "Donner les indices avec subtilité et bienveillance pour que le jeu ne dépasse pas la durée maximum."
      },
      {
        "order": 3,
        "text": "Contact perdu avec une équipe : utiliser le mode « Localiser » de l'iPhone pour retrouver le sac de l'équipe. Si ça ne suffit pas, appeler un responsable pour qu'il appelle le participant en charge."
      },
      {
        "order": 4,
        "text": "Problème de matériel : essayer de le régler avec les ressources prévues au lieu de stockage, puis le signaler à un responsable après le jeu."
      },
      {
        "order": 5,
        "text": "Problème majeur (perte des clés d'un monument, dégradation d'un lieu du patrimoine, casse de gros matériel) : contacter immédiatement un responsable."
      },
      {
        "order": 6,
        "text": "Clients mécontents qui veulent arrêter : aller à leur rencontre, tempérer, récupérer le matériel et prévenir immédiatement un responsable."
      }
    ],
    "is_placeholder": true,
    "tags": [
      "escape-life",
      "animation"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 30,
    "scope_kind": "locations",
    "sub_group": "escape_life",
    "scope_location_ids": [
      "loc-escape_sierre",
      "loc-escape_sion"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-03T14:03:18.899438+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "fc9b17d1-edf4-43f4-8fcb-e7a7be305225",
    "category": "procedure_deroulement",
    "title": "Nettoyage de la salle",
    "summary": "Nettoyage rapide et obligatoire entre chaque groupe",
    "content_steps": [
      {
        "order": 1,
        "text": "Nettoyer les casques VR (mousses de contact) et les remettre en position zéro."
      },
      {
        "order": 2,
        "text": "Nettoyer les manettes : poignées."
      },
      {
        "order": 3,
        "text": "Vérifier que toutes les batteries des bacs sont pleines, sinon les mettre à charger."
      },
      {
        "order": 4,
        "text": "Vérifier visuellement l'état du matériel (pas de casse)."
      },
      {
        "order": 5,
        "text": "S'il n'y a plus de partie prévue après : mettre les casques en standby et éteindre les PC."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "rh_nettoyage",
      "nettoyage",
      "entre-groupes",
      "rh_vr_circuit",
      "entretien",
      "hygiène"
    ],
    "is_active": true,
    "version": 2,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 30,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-nettoyage_center",
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:35.381212+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "eea07d1b-9783-47be-b644-fb92006a0e61",
    "category": "procedure_deroulement",
    "title": "Script de fin Da Vinci Code",
    "summary": "Ce qu'on raconte aux clients à la fin du Da Vinci Code.",
    "content_steps": [
      {
        "order": 1,
        "text": "Le Chrisme (carré noir) : combinaison de lettres grecques, ancien signe chrétien. La croix est le « Chi » (prononcé ki), le P est le « Rho », avec l'alpha (le début) et l'oméga (la fin)."
      },
      {
        "order": 2,
        "text": "Le X et le P superposés sont les initiales de « Christos ». À Sion, des gravures de la fin de l'Empire romain montrent qu'il y avait déjà d'importantes communautés chrétiennes à la fin de l'Antiquité."
      },
      {
        "order": 3,
        "text": "L'acte de contrition (les morceaux de parchemin) : une confession écrite pour se repentir de ses péchés. Celui-ci est fictif ; il aurait pu être écrit par le cardinal Matthieu Schiner, que les joueurs ont croisé, notamment à la Sionne."
      },
      {
        "order": 4,
        "text": "Schiner était prince-évêque de Sion à la fin du Moyen Âge et au début de la Renaissance, chef politique et militaire du Valais."
      },
      {
        "order": 5,
        "text": "Le pouvoir à Sion était partagé entre les bourgeois (menés par la famille Supersaxo) et l'Église (menée par le cardinal), qui aurait demandé l'aide du Diable pour avoir le plein pouvoir. Par cet acte, il aurait reconnu ses fautes."
      },
      {
        "order": 6,
        "text": "Fun facts : c'est grâce aux Supersaxo que Schiner a pu faire des études et devenir cardinal ; ce sont aussi les Supersaxo qui ont fait construire la Maison du Diable."
      }
    ],
    "is_placeholder": true,
    "tags": [
      "davinci",
      "script",
      "fin"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 30,
    "scope_kind": "games",
    "sub_group": "escape_sion",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-davinci"
    ],
    "created_at": "2026-11-03T14:03:18.899438+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "821ca428-4911-4848-9ecc-e5ee8cf66bc9",
    "category": "procedure_deroulement",
    "title": "🚧 Novasphère : fin de partie, vidéos et avis (à compléter)",
    "summary": "Débriefing, vidéos, avis Google et réseaux sociaux à l'Usine de Chandoline : à compléter.",
    "content_steps": [
      {
        "order": 1,
        "text": "🚧 Aucune procédure documentée pour l'instant — à compléter (débriefing, envoi des vidéos, avis Google, réseaux sociaux)."
      }
    ],
    "is_placeholder": true,
    "tags": [
      "novasphere",
      "chandoline",
      "fin"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 40,
    "scope_kind": "locations",
    "sub_group": "chandoline",
    "scope_location_ids": [
      "loc-chandoline"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-03T14:03:18.899438+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "04019d0a-d3d1-4e49-8d64-e11d1b48ccea",
    "category": "procedure_deroulement",
    "title": "Escape Life : fin de partie et avis Google",
    "summary": "Clore le jeu avec les clients, récupérer le matériel et proposer un avis Google.",
    "content_steps": [
      {
        "order": 1,
        "text": "Da Vinci Code : faire le script de fin (fiche « Script de fin Da Vinci Code »). Le Feu sacré : faire le final au lieu prévu (Château Villa avec 1 équipe)."
      },
      {
        "order": 2,
        "text": "Récupérer tous les éléments de jeu auprès des joueurs."
      },
      {
        "order": 3,
        "text": "Inviter les clients à laisser un avis Google, sauf s'ils n'ont pas apprécié l'expérience."
      },
      {
        "order": 4,
        "text": "Remercier le groupe et lui souhaiter une bonne fin de journée."
      }
    ],
    "is_placeholder": true,
    "tags": [
      "escape-life",
      "fin",
      "avis"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 40,
    "scope_kind": "locations",
    "sub_group": "escape_life",
    "scope_location_ids": [
      "loc-escape_sierre",
      "loc-escape_sion"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-03T14:03:18.899438+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "f0b61e03-8884-4d8f-baa4-a0996d45144c",
    "category": "procedure_deroulement",
    "title": "Utilisation de la machine à pop-corn",
    "summary": "Allumer, lancer la cuisson, servir et éteindre la machine à pop-corn.",
    "content_steps": [
      {
        "order": 1,
        "text": "Allumer au setup : interrupteur POWER & LIGHT, puis HEAT pour préchauffer la cuve."
      },
      {
        "order": 2,
        "text": "Lancer la cuisson pour que le pop-corn soit prêt à la fin de la partie : verser l'huile (une cuillère à soupe pour une grosse dose) et le maïs dans la cuve et une bonne pincée de sel, enclencher TURN (mélangeur), fermer les portes et laisser éclater."
      },
      {
        "order": 3,
        "text": "Quand l'éclatement est terminé (environ 3 minutes), basculer la cuve avec la poignée pour vider le pop-corn dans le bac."
      },
      {
        "order": 4,
        "text": "Servir le pop-corn après la session de jeu, quand les clients s'installent à table au lobby : Un grand bol de pop-corn par table est offert. Laisser la lumière allumée pour le garder au chaud."
      },
      {
        "order": 5,
        "text": "Après le départ des clients : éteindre la machine (HEAT et TURN, puis POWER & LIGHT, voir le post-it sur la machine). Le pop-corn restant reste dans le bac de la machine éteinte. Nettoyer la machine."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "pop-corn",
      "convivialité",
      "accueil",
      "rh_vr_circuit"
    ],
    "is_active": true,
    "version": 12,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 40,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:35.381212+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "ac42e860-2671-4261-93d0-d9dd52944266",
    "category": "procedure_deroulement",
    "title": "Accueil des clients",
    "summary": "Accueillir le groupe directement au salon.",
    "content_steps": [
      {
        "order": 1,
        "text": "Accueillir chaleureusement le groupe dès son arrivée et le diriger directement au salon. Si le groupe est grand ou si le salon est occupé, installer les clients dans le lobby."
      },
      {
        "order": 2,
        "text": "Se présenter et faire connaissance rapidement : qui sont-ils, pourquoi sont-ils venus, comment nous ont-ils connus ?"
      },
      {
        "order": 3,
        "text": "Passer ensuite au check-in QR."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "lobby",
      "accueil",
      "rh_vr_circuit",
      "installation"
    ],
    "is_active": true,
    "version": 14,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 50,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:35.381212+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "c024f1ad-1f4a-4154-a61c-e4363a5f0081",
    "category": "procedure_deroulement",
    "title": "Escape Life : rangement des salles et retour au stock",
    "summary": "Remettre chaque salle en état pour le prochain animateur et ranger le matériel au stock.",
    "content_steps": [
      {
        "order": 1,
        "text": "Salles : remettre chaque salle en état et bien rangée pour l'animateur du prochain jeu."
      },
      {
        "order": 2,
        "text": "Ramasser les déchets laissés par les clients et vérifier qu'il n'y a pas de dégradation."
      },
      {
        "order": 3,
        "text": "Laisser les cadenas ouverts à l'intérieur des boîtes qu'ils doivent verrouiller."
      },
      {
        "order": 4,
        "text": "Éteindre les lumières, débrancher les appareils électroniques, fermer et verrouiller les portes d'entrée."
      },
      {
        "order": 5,
        "text": "Stock : remettre le matériel à sa place (des étiquettes indiquent l'emplacement de chaque élément), vider les sacs d'animation, jeter les déchets."
      },
      {
        "order": 6,
        "text": "Mettre à charger le téléphone d'animation et les batteries externes."
      },
      {
        "order": 7,
        "text": "Déclarer tout matériel défectueux ou énigme à remplacer (ou remplacée), même si ce n'est pas de ton fait. Perte ou dégradation : prévenir un responsable."
      }
    ],
    "is_placeholder": true,
    "tags": [
      "escape-life",
      "rangement"
    ],
    "is_active": false,
    "version": 2,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 50,
    "scope_kind": "locations",
    "sub_group": "escape_life",
    "scope_location_ids": [
      "loc-escape_sion",
      "loc-escape_sierre"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-03T14:03:18.899438+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "f100aef2-dcb2-4ec2-af1c-90390cd63bee",
    "category": "procedure_deroulement",
    "title": "Check-in QR et consentement",
    "summary": "Faire scanner le QR code de check-in et expliquer le consentement.",
    "content_steps": [
      {
        "order": 1,
        "text": "Demander à chaque client de scanner le QR code CHECK IN avec son téléphone"
      },
      {
        "order": 2,
        "text": "Préciser qu'il s'agit d'un consentement INDIVIDUEL aux conditions générales"
      },
      {
        "order": 3,
        "text": "Insister : un scan par personne (pas un scan pour tout le groupe)"
      },
      {
        "order": 4,
        "text": "S'assurer que chaque personne a bien scanné avant de passer à l'étape suivante"
      },
      {
        "order": 5,
        "text": "Répondre aux questions sur les CG si nécessaire"
      }
    ],
    "is_placeholder": false,
    "tags": [
      "QR",
      "check-in",
      "rh_vr_circuit",
      "CG",
      "consentement"
    ],
    "is_active": true,
    "version": 2,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 60,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:35.381212+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "0ab0b80e-fd96-42c9-b8f8-572f26bb7f58",
    "category": "procedure_deroulement",
    "title": "Procédure des boissons",
    "summary": "Proposer, noter et encaisser les boissons, puis reporter les ventes dans GMassignee.",
    "content_steps": [
      {
        "order": 1,
        "text": "Avant l'arrivée des clients, contrôler que le frigo des boissons clients est plein. S'il manque des boissons et qu'il n'y a personne au secrétariat, le signaler dans une remarque à la fin de la session de jeu."
      },
      {
        "order": 2,
        "text": "Informer les clients et leur montrer la feuille à disposition pour noter les boissons consommées : ils peuvent se servir dans le frigo, noter ce qu'ils prennent, et le règlement se fera tout à la fin."
      },
      {
        "order": 3,
        "text": "Après le jeu, au lobby : le GM se positionne au frigo, demande qui veut une boisson et fait le service lui-même. L'eau est à disposition gratuitement."
      },
      {
        "order": 4,
        "text": "Toutes les boissons consommées par le groupe sont notées au fur et à mesure sur la feuille."
      },
      {
        "order": 5,
        "text": "Encaisser à la fin, avant le départ des clients : annoncer le total, le client paie par Twint en scannant le QR code affiché sur le frigo ou sur la carte, puis vérifier la confirmation du paiement sur son téléphone."
      },
      {
        "order": 6,
        "text": "Ne pas oublier de reporter les ventes en détail dans GMassignee (suivi de la session : boissons, quantités, montant encaissé)."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "boissons",
      "accueil",
      "rh_vr_circuit",
      "vente"
    ],
    "is_active": true,
    "version": 8,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 70,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:35.381212+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "eba34c79-3516-4398-b3db-ff2d61b86899",
    "category": "procedure_deroulement",
    "title": "Vestiaire et casiers",
    "summary": "Comment gérer le vestiaire avant d'équiper les clients",
    "content_steps": [
      {
        "order": 1,
        "text": "Demander aux clients de laisser vestes, pulls et sacs dans les casiers"
      },
      {
        "order": 2,
        "text": "Important : tous les appareils électroniques aux casiers (téléphones, montres, etc.)"
      },
      {
        "order": 3,
        "text": "Conseiller de s'habiller léger pour le confort en jeu"
      },
      {
        "order": 4,
        "text": "Montrer où se trouvent les casiers au salon"
      },
      {
        "order": 5,
        "text": "Les porteurs de lunettes peuvent garder leurs lunettes : les casques sont prévus pour."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "vestiaire",
      "préparation",
      "casiers",
      "rh_vr_circuit"
    ],
    "is_active": true,
    "version": 2,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 80,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:35.381212+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "80b0dfd8-0235-46d8-ae3a-45fb476b5f8f",
    "category": "procedure_deroulement",
    "title": "Pitch du studio et des jeux",
    "summary": "Comment présenter le Virtual Reality Center et les jeux aux clients",
    "content_steps": [
      {
        "order": 1,
        "text": "Rester court et bref : quelques phrases seulement. Les explications et détails seront discutés après le jeu, au débriefing."
      },
      {
        "order": 2,
        "text": "Adapter ton pitch au jeu choisi et au profil du groupe."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "pitch",
      "présentation",
      "accueil",
      "rh_vr_circuit"
    ],
    "is_active": true,
    "version": 3,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 90,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:13.863281+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "cd2dd6e4-a46c-4a10-8e66-fab2464d2663",
    "category": "procedure_deroulement",
    "title": "Briefing de sécurité",
    "summary": "Rassurer sur le mal des transports et rappeler les règles de sécurité (10 commandements).",
    "content_steps": [
      {
        "order": 1,
        "text": "Demander si les clients ont déjà fait de la VR."
      },
      {
        "order": 2,
        "text": "Expliquer le mal des transports (motion sickness) : on a mal au cœur quand les yeux et le corps ne sont pas d'accord.\nC'est comme être assis à l'envers du sens de marche dans le train."
      },
      {
        "order": 3,
        "text": "Rassurer : ici, personne ne va être malade, car on se déplace en 1 pour 1, comme dans la vraie vie.\nUn pas dans la halle, c'est un pas dans le jeu."
      },
      {
        "order": 4,
        "text": "Expliquer : interaction et coopération possibles (vous vous voyez, vous pouvez échanger des objets)."
      },
      {
        "order": 5,
        "text": "Demander si quelqu'un souffre d'épilepsie, porte un pacemaker ou est enceinte : informer ces personnes des risques avant de jouer."
      },
      {
        "order": 6,
        "text": "Ne jamais franchir les lignes de grille blanches ou rouges : ce sont les limites de jeu."
      },
      {
        "order": 7,
        "text": "Rappeler une partie des 10 commandements lus au check-in :\n• suivre les instructions du GM ;\n• respecter les murs et les éléments du jeu, car c'est peut-être un vrai mur ;\n• ne pas s'appuyer sur un élément du jeu, car il n'existe pas ;\n• ne pas courir et ne pas se déplacer en reculant ;\n• ne pas se coucher au sol, car l'angle de vision du casque est plus petit que dans la réalité."
      },
      {
        "order": 8,
        "text": "Ne pas lancer, balancer ni laisser tomber les manettes ou objets, et ne pas les utiliser avec trop de force."
      },
      {
        "order": 9,
        "text": "Garder toujours une distance de sécurité avec les autres joueurs (risque de collision)."
      },
      {
        "order": 10,
        "text": "Pas d'alcool : personne ne joue en état d'ivresse."
      },
      {
        "order": 11,
        "text": "En cas de problème ou d'inconfort : lever la main, on retire le casque et on regarde ce qu'il se passe."
      },
      {
        "order": 12,
        "text": "Indiquer que le GM est toujours à proximité en cas de problème pendant le jeu, et qu'il peut voir tout ce que les joueurs voient."
      },
      {
        "order": 13,
        "text": "Prévenir que le non-respect des règles peut entraîner l'arrêt de l'expérience, et que chaque joueur est responsable des dégâts qu'il cause."
      },
      {
        "order": 14,
        "text": "Terminer sur une note positive : profitez et amusez-vous à fond !"
      }
    ],
    "is_placeholder": false,
    "tags": [
      "briefing",
      "pitch",
      "sécurité",
      "rh_vr_circuit",
      "règles"
    ],
    "is_active": true,
    "version": 12,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 100,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:35.381212+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "d0fbfe02-2846-4358-ba71-ae60f9a41d02",
    "category": "procedure_deroulement",
    "title": "Contre-indications pour jouer",
    "summary": "Qui ne peut pas jouer et règles de sécurité générales (à compléter)",
    "content_steps": [
      {
        "order": 1,
        "text": "Âge minimum : 9 ans (Serviteur, Planta), 10 ans (Saga, SchoolCrafter)"
      },
      {
        "order": 2,
        "text": "Contre-indications : épilepsie, pacemaker ou grossesse. Ces personnes doivent en parler au GM, qui les informe des risques liés au jeu (commandement n° 8). \nLa prise de risque et la responsabilité est portée au joueur."
      },
      {
        "order": 3,
        "text": "S'habiller léger : vestes et pulls aux casiers"
      },
      {
        "order": 4,
        "text": "Pas d'appareils électroniques en jeu : tout aux casiers"
      }
    ],
    "is_placeholder": false,
    "tags": [
      "sécurité",
      "contre-indications",
      "rh_vr_circuit",
      "règles"
    ],
    "is_active": true,
    "version": 4,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 110,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:13.863281+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "f7823797-8eaf-40b8-af62-b5d2288fc5b0",
    "category": "procedure_deroulement",
    "title": "Animation pendant le jeu",
    "summary": "Comment animer et accompagner les clients pendant qu'ils jouent",
    "content_steps": [
      {
        "order": 1,
        "text": "Lancer le jeu choisi selon sa procédure (voir les fiches de lancement ci-dessous)."
      },
      {
        "order": 2,
        "text": "Remonter les supports de casques à la verticale."
      },
      {
        "order": 3,
        "text": "Relever l'heure de départ ou chronométrer la partie, pour se situer dans le temps pendant le jeu."
      },
      {
        "order": 4,
        "text": "Rester disponible et attentif pendant le jeu.\nIl est interdit d'être sur son téléphone, hormis pour filmer les clients, ou de faire une autre activité que la gestion de la partie en cours."
      },
      {
        "order": 5,
        "text": "Observer les joueurs pour détecter tout problème (placement, malaise, bug, etc.)."
      },
      {
        "order": 6,
        "text": "En cas de bug ou de malaise : intervenir immédiatement (voir les fiches dépannage).\nDéplacer tout de suite le joueur dans une zone sécurisée, pour éviter tout contact avec les autres joueurs, qui ne le voient plus."
      },
      {
        "order": 7,
        "text": "Donner des indices avec subtilité et bienveillance si nécessaire. Évaluer l'avancée du jeu par rapport au timing, en pensant à l'expérience client : les joueurs ne doivent ni être déçus par la simplicité, ni être trop assistés, ni rester bloqués trop longtemps."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "animation",
      "jeu",
      "rh_vr_circuit",
      "accompagnement"
    ],
    "is_active": true,
    "version": 5,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 120,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:35.381212+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "db285a7a-7c65-4622-b019-6685f5435f3f",
    "category": "procedure_deroulement",
    "title": "Débriefing avec les clients",
    "summary": "Comment mener la discussion après le jeu",
    "content_steps": [
      {
        "order": 1,
        "text": "Ouvrir la discussion : demander les impressions générales."
      },
      {
        "order": 2,
        "text": "Écouter les retours positifs et négatifs."
      },
      {
        "order": 3,
        "text": "Faire un vrai débriefing, plus fourni, avec les infos pas données au début : tout est fait maison à Sion (recherche historique, 3D, voix d'acteurs valaisans) ; 2 halles de 160 m² en free roam multijoueur ; conception home-made avec innovations techniques. Puis les détails du jeu joué (voir les fiches Présentation ci-dessous)."
      },
      {
        "order": 4,
        "text": "S'il y a eu des bugs : expliquer que les jeux sont produits ici et sont en constante amélioration."
      },
      {
        "order": 5,
        "text": "Recueillir les suggestions d'amélioration."
      },
      {
        "order": 6,
        "text": "Teaser les autres jeux disponibles."
      },
      {
        "order": 7,
        "text": "Suggérer une vente à chaud : suite (chapitre 2), Saga complète, autres jeux."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "rh_vr_circuit",
      "débriefing",
      "feedback",
      "discussion"
    ],
    "is_active": true,
    "version": 4,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 130,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:35.381212+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "69659e2e-87fd-426b-849e-4fd1de158749",
    "category": "procedure_deroulement",
    "title": "Explication après game de : La Saga",
    "summary": "Au débriefing : revenir sur le jeu que les clients viennent de vivre.",
    "content_steps": [
      {
        "order": 1,
        "text": "Demander leurs impressions sur les deux chapitres : moments préférés, ce qui les a surpris."
      },
      {
        "order": 2,
        "text": "Revenir sur l'histoire complète, de l'enquête de 1478 chez Walter Supersaxo jusqu'à la révélation du Serviteur de la Rédemption (voir les fiches du Serviteur I et II)."
      },
      {
        "order": 3,
        "text": "Leur proposer de revenir pour découvrir un autre jeu (Bataille de la Planta)."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "présentation",
      "jeu"
    ],
    "is_active": true,
    "version": 5,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 140,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-saga"
    ],
    "created_at": "2026-11-04T10:08:12.739415+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "f5bc63d2-400c-4bc4-99be-a6c275c4c8c2",
    "category": "procedure_deroulement",
    "title": "Pitch start : La Saga",
    "summary": "Pitch court d'intro (quelques phrases). Les détails viennent au débriefing.",
    "content_steps": [
      {
        "order": 1,
        "text": "« Vous allez vivre toute l'histoire du Serviteur : le chapitre I, une pause pop-corn, puis le chapitre II. »"
      },
      {
        "order": 2,
        "text": "Faire ensuite le pitch court du chapitre I (voir Pitch start : Le Serviteur I)."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "présentation",
      "jeu"
    ],
    "is_active": true,
    "version": 3,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 150,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-saga"
    ],
    "created_at": "2026-11-04T13:49:50.460141+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "2d8b916b-0fd6-49c8-be16-519f16d4d66f",
    "category": "procedure_deroulement",
    "title": "Explication après game de : Bataille de la Planta",
    "summary": "Au débriefing : revenir sur le jeu que les clients viennent de vivre.",
    "content_steps": [
      {
        "order": 1,
        "text": "Demander leurs impressions : moments préférés, ce qui les a surpris."
      },
      {
        "order": 2,
        "text": "Revenir sur l'histoire : la défense des remparts de Sion le 13 novembre 1475."
      },
      {
        "order": 3,
        "text": "Contexte : le 13 novembre 1475, les milices valaisannes et confédérées repoussent les troupes du duc de Savoie devant Sion. Points forts : entraînement aux techniques de guerre du Moyen Âge (tir à l'arc, lancer de pierres, eau bouillante), puis défense des remparts en équipe, en marchant librement dans Sion et la plaine du Rhône."
      },
      {
        "order": 4,
        "text": "Leur proposer de revenir pour découvrir Le Serviteur."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "présentation",
      "jeu"
    ],
    "is_active": true,
    "version": 4,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 160,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-planta"
    ],
    "created_at": "2026-11-04T10:08:12.739415+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "98cabe1f-6b8a-40d6-bf25-5e694f7cef9e",
    "category": "procedure_deroulement",
    "title": "Pitch start : Le Serviteur I",
    "summary": "Pitch court d'intro (quelques phrases). Les détails viennent au débriefing.",
    "content_steps": [
      {
        "order": 1,
        "text": "« Une série de meurtres secoue Sion et le Manuscrit des 6 Âges du monde a été volé. Votre brigade temporelle est envoyée en 1478 chez le Prince-évêque Walter Supersaxo pour mener l'enquête. »"
      },
      {
        "order": 2,
        "text": "Fouille, mécanismes et action, en équipe."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "présentation",
      "jeu"
    ],
    "is_active": true,
    "version": 3,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 170,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-serviteur"
    ],
    "created_at": "2026-11-04T13:49:50.460141+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "ca801f7c-b3a5-46c5-856a-6351fa97af52",
    "category": "procedure_deroulement",
    "title": "Pitch start : Bataille de la Planta",
    "summary": "Pitch court d'intro (quelques phrases). Les détails viennent au débriefing.",
    "content_steps": [
      {
        "order": 1,
        "text": "« Sion, 13 novembre 1475 : les troupes savoyardes attaquent la cité. Après un entraînement aux armes du Moyen Âge, défendez les remparts de Sion en équipe, arc ou épée en main ! »"
      }
    ],
    "is_placeholder": false,
    "tags": [
      "présentation",
      "jeu"
    ],
    "is_active": true,
    "version": 3,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 180,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-planta"
    ],
    "created_at": "2026-11-04T13:49:50.460141+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "918f7250-5e34-4811-84b0-d0add1ecadcf",
    "category": "procedure_deroulement",
    "title": "Pitch start : Le Serviteur II",
    "summary": "Pitch court d'intro (quelques phrases). Les détails viennent au débriefing.",
    "content_steps": [
      {
        "order": 1,
        "text": "« Avec vos trois clés et le mystérieux dé, franchissez le passage vers le XVIe siècle, reprenez le manuscrit et découvrez enfin qui est le Serviteur de la Rédemption. »"
      },
      {
        "order": 2,
        "text": "C'est la suite et la fin de l'histoire."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "présentation",
      "jeu"
    ],
    "is_active": true,
    "version": 3,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 190,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-serviteur"
    ],
    "created_at": "2026-11-04T13:49:50.460141+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "37a1a690-a494-40cb-adaa-013060973837",
    "category": "procedure_deroulement",
    "title": "Pitch start : Schoolcrafter",
    "summary": "Pitch court d'intro (quelques phrases). Les détails viennent au débriefing.",
    "content_steps": [
      {
        "order": 1,
        "text": "« Le Régime des Précepteurs est tombé. Une intelligence artificielle vous recrute pour reconstruire l'école de demain, et la réussite dépend de votre capacité à coopérer. Vos différences seront-elles la clé ? »"
      },
      {
        "order": 2,
        "text": "Jeu coopératif créé pour les 25 ans de la HEP Valais."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "présentation",
      "jeu"
    ],
    "is_active": true,
    "version": 3,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 200,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-schoolcrafter"
    ],
    "created_at": "2026-11-04T13:49:50.460141+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "863053cb-4259-4e81-88e3-fe46c27ffddb",
    "category": "procedure_deroulement",
    "title": "Équipement",
    "summary": "Amener le groupe en halle de jeu et l'équiper avant la partie.",
    "content_steps": [
      {
        "order": 1,
        "text": "Amener le groupe dans la halle de jeu pour la phase d'équipement."
      },
      {
        "order": 2,
        "text": "En premier, les controllers : montrer comment bien les tenir, mettre les lanières et expliquer les boutons utilisés."
      },
      {
        "order": 3,
        "text": "Faire équiper uniquement les controllers, puis vérifier que tout le monde a compris."
      },
      {
        "order": 4,
        "text": "Ensuite, montrer comment bien mettre le casque. Bien expliquer de ne pas toucher le bouton standby et de ne pas faire de double touch."
      },
      {
        "order": 5,
        "text": "S'il faut des batteries : mettre la batterie dans la poche arrière si possible, avec le câble qui passe derrière l'épaule. Sans poche, équiper le joueur d'une banane."
      },
      {
        "order": 6,
        "text": "Laisser ensuite les clients mettre leur casque."
      },
      {
        "order": 7,
        "text": "S'assurer que tout le monde est confortable : ils vont jouer presque 1 h avec le casque."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "equipement",
      "halle",
      "vr",
      "rh_vr_circuit"
    ],
    "is_active": true,
    "version": 4,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 210,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-03T14:03:18.899438+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "8b388975-31e9-46f5-b7a0-3aa998395bdd",
    "category": "procedure_deroulement",
    "title": "Encourager les avis Google",
    "summary": "Comment demander un avis Google aux clients satisfaits",
    "content_steps": [
      {
        "order": 1,
        "text": "Montrer l'affiche avec le QR code pour les avis Google, ou faire scanner la carte NFC."
      },
      {
        "order": 2,
        "text": "Encourager les clients à laisser un avis : « Si vous avez aimé l'expérience, n'hésitez pas à nous laisser 5 étoiles sur Google ! »"
      },
      {
        "order": 3,
        "text": "Préciser que ça nous aide beaucoup et ne prend qu'une minute"
      },
      {
        "order": 4,
        "text": "Ne PAS insister si les clients n'ont pas aimé l'expérience"
      },
      {
        "order": 5,
        "text": "L'objectif est d'avoir des avis authentiques et positifs"
      }
    ],
    "is_placeholder": false,
    "tags": [
      "réputation",
      "rh_vr_circuit",
      "review",
      "avis",
      "Google"
    ],
    "is_active": true,
    "version": 2,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 220,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:35.381212+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "dc5bde8d-6a72-4e37-8e63-db29cc0596ce",
    "category": "procedure_deroulement",
    "title": "Envoi des vidéos / photos souvenirs",
    "summary": "Comment envoyer les vidéos et photos du jeu aux clients",
    "content_steps": [
      {
        "order": 1,
        "text": "Envoyer les vidéos et photos avec le module « Vidéos & photos souvenirs », en bas de cette liste."
      },
      {
        "order": 2,
        "text": "Au moment du partage, inviter les clients à nous suivre sur les réseaux sociaux (Instagram, Facebook, TikTok)."
      },
      {
        "order": 3,
        "text": "Leur demander de partager leurs vidéos en nous taguant."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "partage",
      "vidéos",
      "souvenirs",
      "rh_vr_circuit"
    ],
    "is_active": true,
    "version": 6,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 230,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:35.381212+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "8592c0f1-05f0-4f87-b0b8-ead460a4f63a",
    "category": "procedure_deroulement",
    "title": "Explication après game de : Le Serviteur I",
    "summary": "Au débriefing : revenir sur le jeu que les clients viennent de vivre.",
    "content_steps": [
      {
        "order": 1,
        "text": "Demander leurs impressions : moments préférés, ce qui les a surpris."
      },
      {
        "order": 2,
        "text": "Revenir sur l'histoire qu'ils viennent de vivre : le vol du Manuscrit des 6 Âges du monde (Archives cantonales du Valais), les meurtres, l'enquête en 1478 chez le Prince-évêque Walter Supersaxo."
      },
      {
        "order": 3,
        "text": "Souligner ce qu'ils ont expérimenté : fouille, mécanismes, action, réflexion, collaboration, time challenge, personnages historiques. Unique au monde, jouable seulement à Sion."
      },
      {
        "order": 4,
        "text": "Leur donner envie de revenir pour le chapitre II, qui révèle enfin qui est le Serviteur de la Rédemption."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "présentation",
      "jeu"
    ],
    "is_active": true,
    "version": 5,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 240,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-serviteur"
    ],
    "created_at": "2026-11-04T10:08:12.739415+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "07422c3b-bf7b-437c-8417-b32fb1d61709",
    "category": "procedure_deroulement",
    "title": "Explication après game de : Le Serviteur II",
    "summary": "Au débriefing : revenir sur le jeu que les clients viennent de vivre.",
    "content_steps": [
      {
        "order": 1,
        "text": "Demander leurs impressions : moments préférés, ce qui les a surpris."
      },
      {
        "order": 2,
        "text": "Revenir sur l'histoire : les trois clés et le dé, le passage au XVIe siècle, le deuxième âge du monde, et la révélation du Serviteur de la Rédemption."
      },
      {
        "order": 3,
        "text": "S'ils n'ont pas joué le chapitre I, leur proposer de revenir pour le découvrir."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "présentation",
      "jeu"
    ],
    "is_active": true,
    "version": 6,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 250,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-serviteur"
    ],
    "created_at": "2026-11-04T10:08:12.739415+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "312b4964-e71b-40b8-b355-076e93dfe79e",
    "category": "procedure_deroulement",
    "title": "Explication après game de : Schoolcrafter",
    "summary": "Au débriefing : revenir sur le jeu que les clients viennent de vivre.",
    "content_steps": [
      {
        "order": 1,
        "text": "Demander leurs impressions : moments préférés, ce qui les a surpris."
      },
      {
        "order": 2,
        "text": "Revenir sur l'histoire : le Régime des Précepteurs est tombé et une intelligence artificielle les a recrutés pour reconstruire l'école de demain. La réussite dépendait de leur coopération : « Vos différences seront-elles la clé ? »"
      },
      {
        "order": 3,
        "text": "Parler du ressenti : à quoi ressemblerait pour eux l'école de demain ?"
      },
      {
        "order": 4,
        "text": "Préciser que le jeu a été développé à l'initiative de la HEP Valais pour ses 25 ans."
      },
      {
        "order": 5,
        "text": "Leur proposer de revenir pour une autre expérience (Le Serviteur, Bataille de la Planta)."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "présentation",
      "jeu"
    ],
    "is_active": true,
    "version": 5,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 260,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-schoolcrafter"
    ],
    "created_at": "2026-11-04T10:08:12.739415+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "5fee5055-5043-448f-a2c4-ef151af957d4",
    "category": "procedure_deroulement",
    "title": "Filmer les moments clés",
    "summary": "Comment capturer les meilleurs moments du jeu",
    "content_steps": [
      {
        "order": 1,
        "text": "Filmer les moments clés du jeu (actions spectaculaires, réactions, coopération) et capturer les moments drôles ou impressionnants pour les vidéos souvenirs."
      },
      {
        "order": 2,
        "text": "Faire une ou plusieurs vidéos de 50 Mo max chacune (environ 40 secondes) : filmer l'écran avec la vision du joueur en jeu ou la vue GM, puis basculer vers les joueurs en action."
      },
      {
        "order": 3,
        "text": "Prendre une photo des joueurs en vrai dans la salle, puis une photo de la même scène vue dans l'éditeur (photo de l'écran). Le but est de comparer la même vue dans le jeu et dans la salle."
      },
      {
        "order": 4,
        "text": "Ces vidéos (et éventuellement des photos) seront envoyées aux clients après le jeu, lors du débriefing."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "vidéo",
      "souvenirs",
      "rh_vr_circuit",
      "capture"
    ],
    "is_active": true,
    "version": 4,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 270,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:35.381212+00:00",
    "updated_at": "2026-11-11T13:21:13.040105+00:00"
  },
  {
    "id": "2661b330-44f0-46be-82e0-13dbb541ed00",
    "category": "procedure_deroulement",
    "title": "Nettoyage et fermeture",
    "summary": "Ranger et nettoyer après le groupe, fermer si dernière partie.",
    "content_steps": [
      {
        "order": 1,
        "text": "Relever les boissons encaissées dans GMassignee."
      },
      {
        "order": 2,
        "text": "Nettoyer le salon."
      },
      {
        "order": 3,
        "text": "Nettoyer le lobby (tables, bar, etc.)."
      },
      {
        "order": 4,
        "text": "Ranger les chaises."
      },
      {
        "order": 5,
        "text": "Ranger l'arrière-cuisine."
      },
      {
        "order": 6,
        "text": "Mettre la vaisselle dans le lave-vaisselle."
      },
      {
        "order": 7,
        "text": "Contrôler le sol et nettoyer si besoin."
      },
      {
        "order": 8,
        "text": "Vérifier que tout est opérationnel pour le groupe suivant."
      },
      {
        "order": 9,
        "text": "Si c'était la dernière partie : éteindre toutes les lumières."
      },
      {
        "order": 10,
        "text": "Verrouiller la porte en partant."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "rh_nettoyage",
      "nettoyage",
      "entre-groupes",
      "rh_vr_circuit",
      "entretien",
      "hygiène"
    ],
    "is_active": true,
    "version": 1,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 280,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center",
      "loc-nettoyage_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-04T12:46:56.468221+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "71eb5c34-86e0-4e2b-9ea1-645b38b00f94",
    "category": "procedure_deroulement",
    "title": "Partage sur les réseaux sociaux",
    "summary": "Comment encourager le partage sur les réseaux sociaux",
    "content_steps": [
      {
        "order": 1,
        "text": "Inviter les clients à nous suivre sur les réseaux sociaux (Instagram, Facebook, TikTok)"
      },
      {
        "order": 2,
        "text": "Leur demander de partager leurs vidéos en nous taguant"
      },
      {
        "order": 3,
        "text": "Montrer les affiches avec les QR codes des réseaux sociaux"
      },
      {
        "order": 4,
        "text": "Expliquer : « Plus vous partagez, plus on fait connaître l'expérience unique du VR Center ! »"
      }
    ],
    "is_placeholder": false,
    "tags": [
      "partage",
      "réseaux sociaux",
      "rh_vr_circuit",
      "marketing"
    ],
    "is_active": true,
    "version": 2,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 290,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:35.381212+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "97ab01fa-6884-47cf-a948-cfd948464a0e",
    "category": "procedure_deroulement",
    "title": "Retour au lobby",
    "summary": "Comment gérer le retour des clients après le jeu",
    "content_steps": [
      {
        "order": 1,
        "text": "Accompagner les clients au salon pour récupérer leurs affaires dans les casiers."
      },
      {
        "order": 2,
        "text": "Les inviter à passer au lobby et à s'installer à table, avec le pop-corn offert."
      },
      {
        "order": 3,
        "text": "Le GM se positionne au frigo, demande si quelqu'un veut une boisson et fait le service lui-même."
      },
      {
        "order": 4,
        "text": "Leur laisser 5 minutes pour reprendre leurs esprits et partager leurs impressions entre eux."
      },
      {
        "order": 5,
        "text": "Pendant ce temps, stopper rapidement le jeu et repositionner le matériel comme il faut (par exemple, rouvrir les casques)."
      },
      {
        "order": 6,
        "text": "Retourner vers les clients pour un vrai débriefing, et s'asseoir avec eux si c'est adéquat."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "déséquipement",
      "transition",
      "rh_vr_circuit",
      "salon"
    ],
    "is_active": true,
    "version": 6,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 300,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:35.381212+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "1333ace7-5f33-4798-a024-f5814630a0a1",
    "category": "procedure_deroulement",
    "title": "Déséquipement",
    "summary": "Retirer les casques en fin de partie et ranger le matériel sur les supports.",
    "content_steps": [
      {
        "order": 1,
        "text": "À la fin de la partie, demander aux joueurs de retirer leur casque doucement, et les avertir du changement brutal d'un monde à l'autre."
      },
      {
        "order": 2,
        "text": "Ramener le groupe aux supports pour qu'ils posent casques et controllers au bon numéro. Brancher immédiatement les casques à la source d'alimentation pour la recharge."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "equipement",
      "halle",
      "vr",
      "rh_vr_circuit"
    ],
    "is_active": true,
    "version": 3,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 310,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-04T11:10:58.211219+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "3290eb63-a4e9-4f60-a12b-9e450536ae7f",
    "category": "procedure_deroulement",
    "title": "Option Planchette",
    "summary": "Option Planchette",
    "content_steps": [
      {
        "order": 1,
        "text": "Si les clients on réservé une option planchette, s'assurer qu'elle est bien présente dans le frigo.\nSi rien n'est présent, avertir immédiatement le responsable"
      },
      {
        "order": 2,
        "text": "Après le jeux, dresser la planchette avec couteau pour le beure sur les tables, avant le débrifing et ne pas oublier de proposer des boissons."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "schoolcrafter",
      "vr",
      "rh_vr_circuit"
    ],
    "is_active": true,
    "version": 3,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 320,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [
      "game-saga",
      "game-planta",
      "game-schoolcrafter",
      "game-serviteur"
    ],
    "created_at": "2026-11-03T13:48:21.506301+00:00",
    "updated_at": "2026-11-10T22:06:03.706665+00:00"
  },
  {
    "id": "70e55d59-b887-4b38-9c08-2ecaa3919fa8",
    "category": "procedure_deroulement",
    "title": "Option Anniversaire",
    "summary": "Option anniversaire ",
    "content_steps": [
      {
        "order": 1,
        "text": "Décorer la salle avec les ballons Anniversaire"
      },
      {
        "order": 2,
        "text": "Contrôler si des ballons sont déjà disponiblent (petite salle ou bas des escalier salle B) avant d'en gonfler de nouveau\nSi vous avez besoin de nouveaux ballons, aller chercher dans le carton dans l'armoire noir à droite de l'entrée des bureaux"
      },
      {
        "order": 3,
        "text": "Donner une boisson gratuit sans alcool pour chaque enfant"
      },
      {
        "order": 4,
        "text": "Après la session, les clients ont la salle à disposition pendant 1h"
      },
      {
        "order": 5,
        "text": "A la fin de la session, demonter, nettoyer la salle et garder les ballons encore en bon état."
      }
    ],
    "is_placeholder": false,
    "tags": [],
    "is_active": true,
    "version": 3,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 330,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [
      "game-planta",
      "game-saga",
      "game-schoolcrafter",
      "game-serviteur"
    ],
    "created_at": "2026-11-10T22:07:02.713364+00:00",
    "updated_at": "2026-11-11T11:14:46.900149+00:00"
  },
  {
    "id": "bb0ec549-624e-466f-be2a-888ff08a6b06",
    "category": "depannage_bugs",
    "title": "Dépannage : Couvent (énigme de la grille)",
    "summary": "Que faire quand l'énigme du Couvent ne se comporte pas normalement.",
    "content_steps": [
      {
        "order": 1,
        "text": "Vidéo d'intro trop petite : laisser le beamer allumé, Restart → REBOOT RASPBERRY PI, attendre, se reconnecter à 10.10.0.1, recontrôler les capteurs puis refaire le test ARM + PIR."
      },
      {
        "order": 2,
        "text": "Un Arduino ou un TF-Luna en rouge : éteindre le beamer (2 pressions), débrancher la prise 5 s, rebrancher, rallumer immédiatement le beamer, puis recontrôler Capteurs / Arduinos et refaire le test ARM + PIR."
      },
      {
        "order": 3,
        "text": "Joueurs descendus mais le jeu reste sur ARMED : appuyer sur SIMULATE PIR."
      },
      {
        "order": 4,
        "text": "Bonne position trouvée mais la validation retombe : appuyer sur SIMULATE PUZZLE."
      },
      {
        "order": 5,
        "text": "Partie interrompue alors que l'énigme était presque résolue : RESET, réarmer si besoin, puis SKIP pour passer à la séquence finale."
      },
      {
        "order": 6,
        "text": "Problème non prévu : ne pas toucher aux câbles, essayer RESET, puis REBOOT RASPBERRY PI, puis une extinction complète."
      },
      {
        "order": 7,
        "text": "Panne persistante : éteindre complètement, passer à l'énigme papier et contacter le responsable technique."
      }
    ],
    "is_placeholder": true,
    "tags": [
      "couvent",
      "davinci",
      "depannage"
    ],
    "is_active": false,
    "version": 3,
    "is_required": false,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 10,
    "scope_kind": "games",
    "sub_group": "escape_sion",
    "scope_location_ids": [],
    "scope_game_ids": [
      "game-davinci"
    ],
    "created_at": "2026-11-03T14:03:18.899438+00:00",
    "updated_at": "2026-11-10T15:26:36.210728+00:00"
  },
  {
    "id": "345912e6-f15c-4471-a358-d1d344bb6d9d",
    "category": "depannage_bugs",
    "title": "Spatial Anchor - Un client (joueur) est connecté mais reste au point 0 au SETUP game",
    "summary": "Le client est connecté mais reste au point 0.",
    "content_steps": [
      {
        "order": 1,
        "text": "Ici, le joueur A1 s'est connecté mais n'a pas pris sa bonne place."
      },
      {
        "order": 2,
        "text": "S'assurer que le Quest est allumé, qu'il n'est pas en veille (résume) et qu'il est présent et actif dans le jeu."
      },
      {
        "order": 3,
        "text": "Éjecter le client du jeu et refaire « Run restart setup » sur les Quest.\nSuivre la procédure Setup.\nRelancer la partie sur le PC une fois le Quest prêt."
      },
      {
        "order": 4,
        "text": "Si le problème persiste :\nUtiliser un autre Quest disponible.\nSi les 7 autres casques sont utilisés, emprunter un Quest de réserve ou celui dans l'autre salle.\nVoir procédure:\nUtiliser en dépannage un Quest de remplacement (en dernier recours)"
      },
      {
        "order": 5,
        "text": "Si le problème n'est pas résolu, contacter un responsable."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "bug",
      "dépannage",
      "incident",
      "rh_vr_circuit"
    ],
    "is_active": true,
    "version": 9,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 10,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [
      "game-saga",
      "game-schoolcrafter",
      "game-serviteur",
      "game-planta"
    ],
    "created_at": "2026-11-02T13:04:13.863281+00:00",
    "updated_at": "2026-11-11T10:17:51.871666+00:00"
  },
  {
    "id": "eb1453dc-84d0-4836-bdb7-235ce520dd56",
    "category": "depannage_bugs",
    "title": "Spatial Anchor - Un client (joueur) est décalé des autres joueurs pendant la partie.",
    "summary": "Spatial Anchor - Un client (joueur) est décalé des autres joueurs pendant la partie : que faire ?",
    "content_steps": [
      {
        "order": 1,
        "text": "Essayer de recalibrer le joueur avec les boutons disponible dans l'UI.\nSi l'allignement ne marche pas tout de suite, sécuriser le joueur et le déplacer en zone sûre.\nEnlever le Quest du client pour faire les réglages."
      },
      {
        "order": 2,
        "text": "Si les boutons d'alignement ne fonctionnent pas et que le joueur est toujours en décalage, quitter le joueur du jeu et refaire la procédure « Run restart setup ».\nVoir la procédure : Setup Quest."
      },
      {
        "order": 3,
        "text": "À la fin de la procédure, relancer le jeu sur le bon PC."
      },
      {
        "order": 4,
        "text": "Contrôler le bon alignement. Si ce n'est pas encore le cas, réutiliser les boutons d'alignement et d'ancre dans l'UI."
      },
      {
        "order": 5,
        "text": "Si le problème persiste, utiliser le Quest disponible de réserve (Run restart setup fait) et lancer le jeu.\nLe joueur n'aura pas son nom, mais pourra continuer la session."
      },
      {
        "order": 6,
        "text": "Si le problème n'est pas solutionné, contacter le responsable."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "matériel",
      "casse",
      "incident",
      "rh_vr_circuit"
    ],
    "is_active": true,
    "version": 5,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 20,
    "scope_kind": "games",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [
      "game-serviteur",
      "game-planta",
      "game-saga",
      "game-schoolcrafter"
    ],
    "created_at": "2026-11-02T13:04:13.863281+00:00",
    "updated_at": "2026-11-11T09:59:56.280194+00:00"
  },
  {
    "id": "9e884e79-7d52-4fc6-9bee-d19e1dd0f940",
    "category": "depannage_bugs",
    "title": "Problème avec les mains de l'avatar - Connexion des controllers",
    "summary": "Les mains de l'avatar sont retournées vers la paume.\nLe joueur n'arrive pas à utiliser le clavier.\nLe joueur ne voit pas ses mains ou un comportement anormal.\n--> Il y a un problème de connexion avec les controllers.",
    "content_steps": [
      {
        "order": 1,
        "text": "Vérifier que les controllers correspondent bien au numéro du Quest."
      },
      {
        "order": 2,
        "text": "Enlever et remettre les piles des deux controllers."
      },
      {
        "order": 3,
        "text": "Vérifier le niveau de batterie des controllers."
      },
      {
        "order": 4,
        "text": "Éjecter le joueur du jeu et refaire la procédure « Run restart setup ».\nVoir la procédure : Setup Quest."
      },
      {
        "order": 5,
        "text": "À la fin de la procédure, relancer le jeu sur le bon PC."
      },
      {
        "order": 6,
        "text": "Si le problème persiste, utiliser un autre Quest disponible de réserve (Run restart setup fait) et lancer le jeu.\nS'il y a un changement de Quest et que cela fonctionne : si les joueurs n'ont pas commencé la mission, il faut recommencer le jeu depuis le début. Demander aux joueurs de se repositionner aux emplacements de départ, éjecter tous les joueurs, quitter le GM et recommencer.\nSi le problème est solutionné en cours de jeu, le joueur n'aura pas le bon nom, mais pourra finir la partie.\nSi il n'y a pas d'autre Quest disponible dans la salle, utiliser un Quest de dépannage (Quest de réserve ou un Quest non utilisé de la salle opposée); suivre la procédure:\nUtiliser en dépannage un Quest de remplacement (en dernier recours)"
      },
      {
        "order": 7,
        "text": "Si le problème n'est pas solutionné, contacter le responsable."
      }
    ],
    "is_placeholder": false,
    "tags": [
      "tracking",
      "dépannage",
      "incident",
      "rh_vr_circuit"
    ],
    "is_active": true,
    "version": 3,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 30,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-02T13:04:13.863281+00:00",
    "updated_at": "2026-11-11T10:21:44.042987+00:00"
  },
  {
    "id": "b1c3c1d7-99f9-424f-a987-9155432921e7",
    "category": "depannage_bugs",
    "title": "Hauteur du sol anormale - floor level",
    "summary": "En préparation de SETUP GAME ou pendant une partie, le sol est positionné plus haut que la normale.",
    "content_steps": [
      {
        "order": 1,
        "text": "Dans le Quest, appuyer sur le bouton Meta pour activer le menu Link."
      },
      {
        "order": 2,
        "text": "Dans les réglages, activer la Boundary ; le Quest vous demandera de refaire la Boundary."
      },
      {
        "order": 3,
        "text": "Une fois la Boundary effectuée, désactiver la Boundary et appuyer à nouveau sur le bouton Meta pour revenir dans le jeu."
      },
      {
        "order": 4,
        "text": "Il est possible que le joueur ait été décalé ou désorienté après la manipulation ; il faudra le réaligner avec les boutons disponibles dans l'UI (voir la fiche de dépannage « Spatial Anchor in game »)."
      },
      {
        "order": 5,
        "text": "Si les boutons d'alignement ne fonctionnent pas et que le joueur est toujours en décalage ou pas à la bonne hauteur, quitter le joueur du jeu et refaire la procédure « Run restart setup ».\nVoir la procédure : Setup Quest."
      },
      {
        "order": 6,
        "text": "Si le problème persiste, utiliser le Quest disponible de réserve (Run restart setup fait) et lancer le jeu."
      },
      {
        "order": 7,
        "text": "Si le problème n'est pas solutionné, contacter le responsable."
      }
    ],
    "is_placeholder": false,
    "tags": [],
    "is_active": true,
    "version": 3,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 40,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-10T22:58:47.991081+00:00",
    "updated_at": "2026-11-10T23:22:12.447213+00:00"
  },
  {
    "id": "47421d1e-6d11-4609-8b1e-b3285fa6f48c",
    "category": "depannage_bugs",
    "title": "Utiliser en dépannage un Quest de remplacement (en dernier recours)",
    "summary": "Connecter un Quest de réserve ou d'une autre salle pour dépannage si tout les Quest possible dans la salle ne sont pas disponible\n(seulement en dernier recours)\n",
    "content_steps": [
      {
        "order": 1,
        "text": "Connecter le Quest de secours sur le bon réseaux wifi correspondant au numéro du Quest à remplacé (Quest B3 = Wifi B3)"
      },
      {
        "order": 2,
        "text": "Une fois connecter refaire la procédure  « Run restart setup » complète."
      },
      {
        "order": 3,
        "text": "Il est possible que le Quest demandera de PAIR avec Meta Horizon link, si c'est le cas :\nouvrir SplashStop sur PC concerné et valider le numéro dans Meta Horizon Link."
      },
      {
        "order": 4,
        "text": "! après la session: Remettre le Quest dans la salle d'origine et NE PAS OUBLIER de le reconnecter à son wifi !"
      },
      {
        "order": 5,
        "text": "Remonter le problème au bug Reporter en indiquant quel Quest à eu le problème, quel problème et quel Quest à été utilisé pour dépanage."
      },
      {
        "order": 6,
        "text": "Si le problème n'est pas solutionner, contacter un responsable"
      }
    ],
    "is_placeholder": false,
    "tags": [],
    "is_active": true,
    "version": 2,
    "is_required": true,
    "skip_version_bump": false,
    "deleted_at": null,
    "sort_order": 40,
    "scope_kind": "locations",
    "sub_group": "vr_center",
    "scope_location_ids": [
      "loc-vr_center"
    ],
    "scope_game_ids": [],
    "created_at": "2026-11-11T10:04:14.55313+00:00",
    "updated_at": "2026-11-11T10:17:26.971218+00:00"
  }
];

export const DEMO_QUIZ: QuizQuestionAdmin[] = [
  {
    "id": "1197cd8a-84de-45e7-8458-b7697bff3b99",
    "fiche_id": "0ab0b80e-fd96-42c9-b8f8-572f26bb7f58",
    "prompt": "Quand encaisse-t-on les boissons consommées par un groupe ?",
    "choices": [
      {
        "id": "fin",
        "text": "À la fin, avant le départ des clients"
      },
      {
        "id": "chaque",
        "text": "À chaque boisson servie"
      },
      {
        "id": "jamais",
        "text": "On ne les encaisse pas, elles sont offertes"
      }
    ],
    "correct_choice_ids": [
      "fin"
    ],
    "order_index": 1,
    "is_example": false
  },
  {
    "id": "9beb365c-c5a2-4a39-9e04-2603f40195bc",
    "fiche_id": "0ab0b80e-fd96-42c9-b8f8-572f26bb7f58",
    "prompt": "Une fois les boissons encaissées, que faut-il encore faire ?",
    "choices": [
      {
        "id": "gma",
        "text": "Reporter les ventes en détail dans GMassignee"
      },
      {
        "id": "rien",
        "text": "Rien"
      },
      {
        "id": "mail",
        "text": "Envoyer un e-mail au client"
      }
    ],
    "correct_choice_ids": [
      "gma"
    ],
    "order_index": 2,
    "is_example": false
  },
  {
    "id": "c4e89d78-260e-4b73-b13a-13cf5c4b827f",
    "fiche_id": "455b8c87-dc3f-4632-8e6f-b82c40390bf7",
    "prompt": "Quelle est la toute première étape de la fiche Setup Quest ?",
    "choices": [
      {
        "id": "a",
        "text": "Allumer le mini PC et ouvrir Génie Deploy"
      },
      {
        "id": "b",
        "text": "Réveiller tous les casques Quest à la main"
      },
      {
        "id": "c",
        "text": "Lancer « Run restart setup »"
      }
    ],
    "correct_choice_ids": [
      "a"
    ],
    "order_index": 1,
    "is_example": false
  },
  {
    "id": "689df24b-d74b-4b4b-8586-f8f8487f64f2",
    "fiche_id": "455b8c87-dc3f-4632-8e6f-b82c40390bf7",
    "prompt": "Dans Génie Deploy, quelle action lancer sur les Quest utilisés ?",
    "choices": [
      {
        "id": "a",
        "text": "Un restart complet du PC"
      },
      {
        "id": "b",
        "text": "Run restart setup"
      },
      {
        "id": "c",
        "text": "Le scan de la boundary seul"
      }
    ],
    "correct_choice_ids": [
      "b"
    ],
    "order_index": 2,
    "is_example": false
  },
  {
    "id": "bd1a10cb-705a-4d73-baa5-cbb12010cc77",
    "fiche_id": "455b8c87-dc3f-4632-8e6f-b82c40390bf7",
    "prompt": "Si un Quest est rouge, que faut-il vérifier en premier ?",
    "choices": [
      {
        "id": "a",
        "text": "Qu'il est bien présent et allumé"
      },
      {
        "id": "b",
        "text": "Qu'il est déjà en Air Link"
      },
      {
        "id": "c",
        "text": "Qu'il a été rechargé pendant la nuit"
      }
    ],
    "correct_choice_ids": [
      "a"
    ],
    "order_index": 3,
    "is_example": false
  },
  {
    "id": "3ce5dc65-3d2a-4c4e-91f0-7d8ac5684784",
    "fiche_id": "455b8c87-dc3f-4632-8e6f-b82c40390bf7",
    "prompt": "Si un Quest est bloqué sur la boundary ou demande « stationary », que faire ?",
    "choices": [
      {
        "id": "a",
        "text": "Éteindre le Quest et passer au suivant"
      },
      {
        "id": "b",
        "text": "Faire la boundary manuellement, y rester et attendre le redémarrage"
      },
      {
        "id": "c",
        "text": "Relancer un run complet du setup sans rien vérifier"
      }
    ],
    "correct_choice_ids": [
      "b"
    ],
    "order_index": 4,
    "is_example": false
  },
  {
    "id": "54c87eab-cb4c-4ede-b6fe-97411ca1d1cf",
    "fiche_id": "455b8c87-dc3f-4632-8e6f-b82c40390bf7",
    "prompt": "Comment allumer les PC GM-A, GM-B et GM-AUX ?",
    "choices": [
      {
        "id": "a",
        "text": "Avec Wake depuis Génie Deploy, comme les autres PC"
      },
      {
        "id": "b",
        "text": "Manuellement, avec l'interrupteur du PC"
      },
      {
        "id": "c",
        "text": "Ils restent toujours allumés, rien à faire"
      }
    ],
    "correct_choice_ids": [
      "b"
    ],
    "order_index": 5,
    "is_example": false
  },
  {
    "id": "b986adf9-4796-46a5-bf76-123915bacfc9",
    "fiche_id": "57d0cfd8-9991-444d-a8c1-96a4d4386f30",
    "prompt": "Pour une partie à 7 ou 8 joueurs, sur quel PC tourne le jeu ?",
    "choices": [
      {
        "id": "a",
        "text": "Sur A8 ou B8"
      },
      {
        "id": "b",
        "text": "Sur un PC auxiliaire (salle A : GM-A ou Aux, salle B : GM-B ou Aux)"
      },
      {
        "id": "c",
        "text": "Sur le mini PC Génie Deploy"
      }
    ],
    "correct_choice_ids": [
      "b"
    ],
    "order_index": 1,
    "is_example": false
  },
  {
    "id": "d7b336b8-9fb3-428c-b491-a4093c0edbe3",
    "fiche_id": "57d0cfd8-9991-444d-a8c1-96a4d4386f30",
    "prompt": "Une fois le jeu démarré sur le PC host, que faut-il faire pour les joueurs ?",
    "choices": [
      {
        "id": "a",
        "text": "Sélectionner les PC joueurs et « Launch selected game », sans relancer le jeu sur le PC host"
      },
      {
        "id": "b",
        "text": "Relancer le jeu sur tous les PC, host compris"
      },
      {
        "id": "c",
        "text": "Faire « Run restart setup » sur tous les Quest"
      }
    ],
    "correct_choice_ids": [
      "a"
    ],
    "order_index": 2,
    "is_example": false
  },
  {
    "id": "ee746c53-d2de-49eb-a3d7-27c03b05b319",
    "fiche_id": "57d0cfd8-9991-444d-a8c1-96a4d4386f30",
    "prompt": "Une fois le jeu lancé, que faire des fenêtres Splashtop ?",
    "choices": [
      {
        "id": "a",
        "text": "Les laisser en plein écran pour surveiller les joueurs"
      },
      {
        "id": "b",
        "text": "Les réduire, pour améliorer les performances et éviter les problèmes"
      },
      {
        "id": "c",
        "text": "Fermer Splashtop complètement"
      }
    ],
    "correct_choice_ids": [
      "b"
    ],
    "order_index": 3,
    "is_example": false
  },
  {
    "id": "93b8f287-b722-4523-996e-9f32bf801088",
    "fiche_id": "57d0cfd8-9991-444d-a8c1-96a4d4386f30",
    "prompt": "À quel niveau régler le volume de chaque Quest ?",
    "choices": [
      {
        "id": "a",
        "text": "Au maximum"
      },
      {
        "id": "b",
        "text": "À la moitié"
      },
      {
        "id": "c",
        "text": "Aux 2/3"
      }
    ],
    "correct_choice_ids": [
      "c"
    ],
    "order_index": 4,
    "is_example": false
  },
  {
    "id": "99e59bcb-fa4e-42a2-a328-082f9621ac19",
    "fiche_id": "57d0cfd8-9991-444d-a8c1-96a4d4386f30",
    "prompt": "Avant une nouvelle partie, que faut-il faire impérativement ?",
    "choices": [
      {
        "id": "a",
        "text": "Rien si tous les Quest sont encore verts"
      },
      {
        "id": "b",
        "text": "Refaire « Run restart setup » pour chaque Quest joué"
      },
      {
        "id": "c",
        "text": "Redémarrer le mini PC Génie Deploy"
      }
    ],
    "correct_choice_ids": [
      "b"
    ],
    "order_index": 5,
    "is_example": false
  },
  {
    "id": "27c8b91e-171c-4a33-a237-4dbbe821bee8",
    "fiche_id": "613c1366-39b9-4485-a3b0-6df30dcfd2df",
    "prompt": "Combien de temps avant l'arrivée des premiers clients faut-il ouvrir la porte d'entrée du bâtiment ?",
    "choices": [
      {
        "id": "5",
        "text": "5 minutes"
      },
      {
        "id": "15",
        "text": "Au moins 15 minutes"
      },
      {
        "id": "arrivee",
        "text": "Seulement quand les clients sonnent"
      }
    ],
    "correct_choice_ids": [
      "15"
    ],
    "order_index": 1,
    "is_example": false
  },
  {
    "id": "d856357a-b0bb-4a82-a2af-d8ca1ea4964c",
    "fiche_id": "613c1366-39b9-4485-a3b0-6df30dcfd2df",
    "prompt": "Quelle lumière ne faut-il pas oublier d'allumer en préparant le bar ?",
    "choices": [
      {
        "id": "frigo",
        "text": "Celle du réfrigérateur des boissons clients"
      },
      {
        "id": "halle",
        "text": "Celle des halles de jeu"
      },
      {
        "id": "wc",
        "text": "Celle des WC"
      }
    ],
    "correct_choice_ids": [
      "frigo"
    ],
    "order_index": 2,
    "is_example": false
  },
  {
    "id": "0d14c171-ce4a-4252-bda0-126da5f523f9",
    "fiche_id": "ac42e860-2671-4261-93d0-d9dd52944266",
    "prompt": "Où installe-t-on un groupe qui arrive ?",
    "choices": [
      {
        "id": "lobby",
        "text": "À une des tables du lobby"
      },
      {
        "id": "halle",
        "text": "Directement en halle"
      },
      {
        "id": "salon",
        "text": "Toujours au salon si disponible et pas plus de 10"
      }
    ],
    "correct_choice_ids": [
      "lobby"
    ],
    "order_index": 1,
    "is_example": false
  },
  {
    "id": "8ee7672b-b618-4003-bc93-4fba7c88822f",
    "fiche_id": "ac42e860-2671-4261-93d0-d9dd52944266",
    "prompt": "Le lobby est plein car plusieurs groupes se croisent. Où installer le deuxième groupe ?",
    "choices": [
      {
        "id": "salon",
        "text": "Au salon"
      },
      {
        "id": "dehors",
        "text": "Le faire attendre dehors"
      },
      {
        "id": "halle",
        "text": "En halle de jeu"
      }
    ],
    "correct_choice_ids": [
      "salon"
    ],
    "order_index": 2,
    "is_example": false
  },
  {
    "id": "9ca8fc8c-b013-42f9-abbf-0192c4b270fd",
    "fiche_id": "bb0ec549-624e-466f-be2a-888ff08a6b06",
    "prompt": "Test questionnaire",
    "choices": [
      {
        "id": "a",
        "text": "oui "
      },
      {
        "id": "b",
        "text": "non"
      }
    ],
    "correct_choice_ids": [
      "a"
    ],
    "order_index": 1,
    "is_example": false
  },
  {
    "id": "254092c5-c77d-4f0e-af13-9bfc8b6c2145",
    "fiche_id": "bba97904-4fe1-4dde-be16-d8c34ff41ca7",
    "prompt": "Premier geste si un client se sent mal ?",
    "choices": [
      {
        "id": "casque",
        "text": "Retirer immédiatement le casque"
      },
      {
        "id": "continuer",
        "text": "Le laisser finir la partie"
      },
      {
        "id": "eau_casque",
        "text": "Lui donner de l'eau sans retirer le casque"
      },
      {
        "id": "a",
        "text": "Le déplacer en zone sécurisée"
      }
    ],
    "correct_choice_ids": [
      "casque",
      "a"
    ],
    "order_index": 1,
    "is_example": true
  },
  {
    "id": "55f7b08d-ba3d-4715-8eb3-10c1198c4721",
    "fiche_id": "bba97904-4fe1-4dde-be16-d8c34ff41ca7",
    "prompt": "Une personne se tient la poitrine, est essoufflée et transpire. Que faites-vous ?",
    "choices": [
      {
        "id": "a",
        "text": "Je laisse le responsable du groupe client gérer cette personne."
      },
      {
        "id": "b",
        "text": "C'est une détresse cardiaque évidente : j'appelle le 144 sans attendre."
      },
      {
        "id": "c",
        "text": "Je joins le responsable pour lui demander ce qu'il faut faire."
      },
      {
        "id": "d",
        "text": "Je reste calme, j'allonge la personne au salon et je finis la partie pour m'en occuper après."
      }
    ],
    "correct_choice_ids": [
      "b"
    ],
    "order_index": 2,
    "is_example": false
  },
  {
    "id": "0df86872-ff28-457f-83d6-0fe9a3efa30c",
    "fiche_id": "f0b61e03-8884-4d8f-baa4-a0996d45144c",
    "prompt": "Que doit-on faire avec la machine à pop-corn en fin de journée ?",
    "choices": [
      {
        "id": "eteindre",
        "text": "L'éteindre complètement"
      },
      {
        "id": "chaud",
        "text": "La laisser allumée pour le lendemain"
      },
      {
        "id": "lumiere",
        "text": "Éteindre seulement la lumière"
      },
      {
        "id": "a",
        "text": "Nettoyer la machine"
      }
    ],
    "correct_choice_ids": [
      "eteindre",
      "a"
    ],
    "order_index": 2,
    "is_example": false
  }
];

export const DEMO_STEP_FICHE_LINKS: Record<string, string[]> = {
  "chandoline:nova_checkin": [
    "64f5e2a4-704b-4258-8a8b-8d20f0ecf1be"
  ],
  "chandoline:nova_closing": [
    "c34d946f-06bc-403e-8cd6-9a24b3b65cfc"
  ],
  "chandoline:nova_debrief": [
    "821ca428-4911-4848-9ecc-e5ee8cf66bc9"
  ],
  "chandoline:nova_equipment": [
    "c34d946f-06bc-403e-8cd6-9a24b3b65cfc"
  ],
  "chandoline:nova_google_review": [
    "821ca428-4911-4848-9ecc-e5ee8cf66bc9"
  ],
  "chandoline:nova_playing": [
    "235bdc65-06de-4f44-aafb-20e5de50e234",
    "c34d946f-06bc-403e-8cd6-9a24b3b65cfc"
  ],
  "chandoline:nova_safety": [
    "67d8536d-0bfc-430c-bb6f-0769c21ad61d"
  ],
  "chandoline:nova_site_prep": [
    "235bdc65-06de-4f44-aafb-20e5de50e234",
    "c34d946f-06bc-403e-8cd6-9a24b3b65cfc"
  ],
  "chandoline:nova_socials": [
    "821ca428-4911-4848-9ecc-e5ee8cf66bc9"
  ],
  "chandoline:nova_welcome": [
    "64f5e2a4-704b-4258-8a8b-8d20f0ecf1be"
  ],
  "chandoline:videos_sent": [
    "821ca428-4911-4848-9ecc-e5ee8cf66bc9",
    "dc5bde8d-6a72-4e37-8e63-db29cc0596ce"
  ],
  "escape_life_sierre:sierre_booking_info": [
    "9ce5bf55-fe82-48c9-b280-45fdff5d258e"
  ],
  "escape_life_sierre:sierre_final_villa": [
    "04019d0a-d3d1-4e49-8d64-e11d1b48ccea",
    "d4b8e920-874f-447a-a627-720486e390b4"
  ],
  "escape_life_sierre:sierre_game_material": [
    "9ce5bf55-fe82-48c9-b280-45fdff5d258e"
  ],
  "escape_life_sierre:sierre_game_start": [
    "6abd223c-d911-4f38-8e30-196b9e5b8d1e"
  ],
  "escape_life_sierre:sierre_google_review": [
    "04019d0a-d3d1-4e49-8d64-e11d1b48ccea"
  ],
  "escape_life_sierre:sierre_medallions": [
    "d4b8e920-874f-447a-a627-720486e390b4"
  ],
  "escape_life_sierre:sierre_meeting_point": [
    "d4b8e920-874f-447a-a627-720486e390b4",
    "cbad4e09-98e1-4bd2-a5c4-62eebf1c8740"
  ],
  "escape_life_sierre:sierre_prepare_cave": [
    "6fd18e21-e981-4678-8aca-72ac5b737ef7",
    "d4b8e920-874f-447a-a627-720486e390b4"
  ],
  "escape_life_sierre:sierre_prepare_villa": [
    "6fd18e21-e981-4678-8aca-72ac5b737ef7",
    "d4b8e920-874f-447a-a627-720486e390b4"
  ],
  "escape_life_sierre:sierre_stock_arrival": [
    "9ce5bf55-fe82-48c9-b280-45fdff5d258e"
  ],
  "escape_life_sierre:sierre_stock_return": [
    "c024f1ad-1f4a-4154-a61c-e4363a5f0081"
  ],
  "escape_life_sierre:sierre_team_tracking": [
    "6abd223c-d911-4f38-8e30-196b9e5b8d1e"
  ],
  "escape_life_sierre:sierre_tidy_cave": [
    "c024f1ad-1f4a-4154-a61c-e4363a5f0081",
    "d4b8e920-874f-447a-a627-720486e390b4"
  ],
  "escape_life_sierre:sierre_tidy_villa": [
    "c024f1ad-1f4a-4154-a61c-e4363a5f0081",
    "d4b8e920-874f-447a-a627-720486e390b4"
  ],
  "escape_life_sion:sion_animation": [
    "6abd223c-d911-4f38-8e30-196b9e5b8d1e",
    "bb0ec549-624e-466f-be2a-888ff08a6b06"
  ],
  "escape_life_sion:sion_booking_info": [
    "9ce5bf55-fe82-48c9-b280-45fdff5d258e"
  ],
  "escape_life_sion:sion_collect_material": [
    "04019d0a-d3d1-4e49-8d64-e11d1b48ccea"
  ],
  "escape_life_sion:sion_couvent_start": [
    "1b60d09c-3fe3-459d-84d2-10b4f672b4a5",
    "bb0ec549-624e-466f-be2a-888ff08a6b06"
  ],
  "escape_life_sion:sion_couvent_stop": [
    "1b60d09c-3fe3-459d-84d2-10b4f672b4a5"
  ],
  "escape_life_sion:sion_end_script": [
    "eea07d1b-9783-47be-b644-fb92006a0e61"
  ],
  "escape_life_sion:sion_game_material": [
    "9ce5bf55-fe82-48c9-b280-45fdff5d258e"
  ],
  "escape_life_sion:sion_google_review": [
    "04019d0a-d3d1-4e49-8d64-e11d1b48ccea"
  ],
  "escape_life_sion:sion_meeting_point": [
    "a7d894cd-ae8d-4615-9309-ed9f768df9c0"
  ],
  "escape_life_sion:sion_prepare_stages": [
    "6fd18e21-e981-4678-8aca-72ac5b737ef7"
  ],
  "escape_life_sion:sion_stock_arrival": [
    "9ce5bf55-fe82-48c9-b280-45fdff5d258e"
  ],
  "escape_life_sion:sion_stock_return": [
    "c024f1ad-1f4a-4154-a61c-e4363a5f0081"
  ],
  "escape_life_sion:sion_team_tracking": [
    "6abd223c-d911-4f38-8e30-196b9e5b8d1e"
  ],
  "escape_life_sion:sion_tidy_rooms": [
    "c024f1ad-1f4a-4154-a61c-e4363a5f0081"
  ],
  "escape_life_sion:sion_vinum_glasses": [
    "9976312d-9c18-4ab8-a5df-ff69d6955d91"
  ],
  "escape_life_sion:sion_vinum_material": [
    "9976312d-9c18-4ab8-a5df-ff69d6955d91"
  ],
  "vr_centre_client:cleaning": [
    "fc9b17d1-edf4-43f4-8fcb-e7a7be305225"
  ],
  "vr_centre_client:closing": [
    "2661b330-44f0-46be-82e0-13dbb541ed00"
  ],
  "vr_centre_client:game_filming": [
    "5fee5055-5043-448f-a2c4-ef151af957d4"
  ],
  "vr_centre_client:game_intro": [
    "80b0dfd8-0235-46d8-ae3a-45fb476b5f8f",
    "98cabe1f-6b8a-40d6-bf25-5e694f7cef9e",
    "918f7250-5e34-4811-84b0-d0add1ecadcf",
    "f5bc63d2-400c-4bc4-99be-a6c275c4c8c2",
    "2d8b916b-0fd6-49c8-be16-519f16d4d66f",
    "312b4964-e71b-40b8-b355-076e93dfe79e"
  ],
  "vr_centre_client:game_playing": [
    "f7823797-8eaf-40b8-af62-b5d2288fc5b0",
    "e3592ebe-26a8-41d6-ab1a-6c629099f883",
    "b8e8c72b-9587-4195-9d39-41cafde8f8b7",
    "e99a5099-509a-417b-bfc1-def9778c587f"
  ],
  "vr_centre_client:google_review": [
    "8b388975-31e9-46f5-b7a0-3aa998395bdd"
  ],
  "vr_centre_client:hall_equipment": [
    "863053cb-4259-4e81-88e3-fe46c27ffddb"
  ],
  "vr_centre_client:hall_unequip": [
    "1333ace7-5f33-4798-a024-f5814630a0a1"
  ],
  "vr_centre_client:lobby_setup": [
    "613c1366-39b9-4485-a3b0-6df30dcfd2df",
    "85467012-85d5-43d3-b51d-2e9a08d49c32",
    "3290eb63-a4e9-4f60-a12b-9e450536ae7f",
    "70e55d59-b887-4b38-9c08-2ecaa3919fa8"
  ],
  "vr_centre_client:reception_checkin": [
    "f100aef2-dcb2-4ec2-af1c-90390cd63bee"
  ],
  "vr_centre_client:reception_debrief": [
    "db285a7a-7c65-4622-b019-6685f5435f3f",
    "07422c3b-bf7b-437c-8417-b32fb1d61709",
    "2d8b916b-0fd6-49c8-be16-519f16d4d66f",
    "312b4964-e71b-40b8-b355-076e93dfe79e",
    "69659e2e-87fd-426b-849e-4fd1de158749",
    "8592c0f1-05f0-4f87-b0b8-ead460a4f63a"
  ],
  "vr_centre_client:reception_popcorn": [
    "f0b61e03-8884-4d8f-baa4-a0996d45144c",
    "0ab0b80e-fd96-42c9-b8f8-572f26bb7f58"
  ],
  "vr_centre_client:reception_seating": [
    "ac42e860-2671-4261-93d0-d9dd52944266"
  ],
  "vr_centre_client:room_prep": [
    "132e6859-dc33-4d04-b5f8-87cc844c4f82",
    "455b8c87-dc3f-4632-8e6f-b82c40390bf7",
    "57d0cfd8-9991-444d-a8c1-96a4d4386f30"
  ],
  "vr_centre_client:salon_briefing": [
    "cd2dd6e4-a46c-4a10-8e66-fab2464d2663",
    "d0fbfe02-2846-4358-ba71-ae60f9a41d02"
  ],
  "vr_centre_client:salon_lockers": [
    "eba34c79-3516-4398-b3db-ff2d61b86899"
  ],
  "vr_centre_client:salon_return": [
    "97ab01fa-6884-47cf-a948-cfd948464a0e"
  ],
  "vr_centre_client:videos_sent": [
    "dc5bde8d-6a72-4e37-8e63-db29cc0596ce"
  ]
};

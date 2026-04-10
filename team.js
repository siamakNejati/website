(() => {
  const grid = document.querySelector("[data-team-grid]");
  const status = document.querySelector("[data-team-status]");

  if (!grid) {
    return;
  }

  const DIRECTORY_URL = "./Team%20Headshots/";
  const MANIFEST_URL = "./team-members.json";
  const LINKEDIN_ICON_URL = "./linkedin.svg";
  const SCHOLAR_ICON_URL = "./google-scholar.svg";
  const POLL_INTERVAL = 12000;
  const NAME_COLLATOR = new Intl.Collator(undefined, { sensitivity: "base" });
  const TOUCH_TOGGLE_QUERY = window.matchMedia("(hover: none), (pointer: coarse)");
  const DEFAULT_MEMBERS = [
    {
      name: "Ahmed El-Harairy",
      src: "./Team%20Headshots/Ahmed%20El-Harairy.png",
      linkedin: "https://www.linkedin.com/in/ahmed-el-harairy-6411a4189/",
      scholar: "https://scholar.google.com/citations?hl=en&user=lV7vjy4AAAAJ"
    },
    {
      name: "Anita Saakyan",
      src: "./Team%20Headshots/Anita%20Saakyan.png",
      linkedin: "https://www.linkedin.com/in/anita-saakyan-542785386/"
    },
    { name: "Brianna Ryan", src: "./Team%20Headshots/Brianna%20Ryan.png" },
    { name: "Bruce Baker", src: "./Team%20Headshots/Bruce%20Baker.png" },
    { name: "Coby Zach", src: "./Team%20Headshots/Coby%20Zach.png" },
    { name: "Danielle Cutsor", src: "./Team%20Headshots/Danielle%20Cutsor.png" },
    {
      name: "Hamidreza Mohajeri Khorasani",
      src: "./Team%20Headshots/Hamidreza%20Mohajeri%20Khorasani.png",
      linkedin: "https://www.linkedin.com/in/hamidreza-mohajeri-6313201a8/",
      scholar: "https://scholar.google.com/citations?user=ryxyO4wAAAAJ&hl=en&oi=ao"
    },
    { name: "Hariri Sree Sharavanan", src: "./Team%20Headshots/Hariri%20Sree%20Sharavanan.png" },
    {
      name: "Mohammad Arham Khan",
      src: "./Team%20Headshots/Mohammad%20Arham%20Khan.png",
      linkedin: "https://www.linkedin.com/in/mohammad-arham-khan-79b5601a1/",
      scholar: "https://scholar.google.com/citations?user=CCoUMacAAAAJ&hl=en"
    },
    {
      name: "Mostafa Dadashi Firouzjaei",
      src: "./Team%20Headshots/Mostafa%20Dadashi%20Firouzjaei.png",
      linkedin: "https://www.linkedin.com/in/mostafa-dadashi-firouzjaei/",
      scholar: "https://scholar.google.com/citations?hl=en&oi=ao&user=Zk8e28AAAAAJ"
    },
    {
      name: "Parvez Amin Khan",
      src: "./Team%20Headshots/Parvez%20Amin%20Khan.png",
      linkedin: "https://www.linkedin.com/in/parvez-amin-khan-75057b5b/"
    },
    { name: "Sam Peterson", src: "./Team%20Headshots/Sam%20Peterson.png" },
    {
      name: "Shadi Motamed",
      src: "./Team%20Headshots/Shadi%20Motamed.png",
      linkedin: "https://www.linkedin.com/in/shadimotamed/",
      scholar: "https://scholar.google.com/citations?hl=en&user=KKpPhHkAAAAJ"
    },
    {
      name: "Siamak Nejati",
      src: "./Team%20Headshots/Siamak%20Nejati.png",
      linkedin: "https://www.linkedin.com/in/siamak-nejati-3baa8b11/",
      scholar: "https://scholar.google.com/citations?hl=en&user=Sbb_Jy0AAAAJ"
    }
  ];

  let lastSignature = "";
  const usesTouchToggle = () => TOUCH_TOGGLE_QUERY.matches;

  const toText = (value) => (typeof value === "string" ? value.trim() : "");
  const toMemberName = (value) => value.replace(/\.png$/i, "");
  const toMemberSrc = (fileName) => DIRECTORY_URL + encodeURIComponent(fileName);
  const toLastName = (name) => {
    const parts = toText(name).split(/\s+/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "";
  };
  const compareMembers = (left, right) => {
    const lastNameComparison = NAME_COLLATOR.compare(toLastName(left.name), toLastName(right.name));

    if (lastNameComparison !== 0) {
      return lastNameComparison;
    }

    return NAME_COLLATOR.compare(left.name, right.name);
  };

  const toAbsoluteUrl = (value) => {
    const candidate = toText(value);
    if (!candidate) {
      return "";
    }

    try {
      const url = new URL(candidate);
      return /^https?:$/i.test(url.protocol) ? url.toString() : "";
    } catch (error) {
      return "";
    }
  };

  const normalizeMembers = (members) => members
    .filter((member) => typeof member?.src === "string" && /\.png$/i.test(member.src))
    .map((member) => {
      const name = toText(member.name) || toMemberName(decodeURIComponent(member.src.split("/").pop() || ""));
      const linkedin = toAbsoluteUrl(member.linkedin);
      const scholar = toAbsoluteUrl(member.scholar);

      return {
        name,
        src: member.src,
        linkedin,
        scholar
      };
    })
    .sort(compareMembers);

  const mergeMembers = (manifestMembers, directoryMembers) => {
    const merged = new Map();

    manifestMembers.forEach((member) => {
      merged.set(member.src, member);
    });

    directoryMembers.forEach((member) => {
      if (!merged.has(member.src)) {
        merged.set(member.src, member);
      }
    });

    return Array.from(merged.values())
      .sort(compareMembers);
  };

  const createAction = ({ href, iconSrc, label, modifierClass }) => {
    const action = document.createElement("a");
    const icon = document.createElement("img");

    action.className = "team-card-action " + modifierClass;
    action.href = href;
    action.target = "_blank";
    action.rel = "noopener noreferrer";
    action.setAttribute("aria-label", label);
    action.title = label;

    icon.className = "team-card-action-icon";
    icon.src = iconSrc;
    icon.alt = "";
    icon.loading = "lazy";
    icon.decoding = "async";

    action.appendChild(icon);

    return action;
  };

  const setExpandedState = (card, expanded) => {
    const portrait = card?.querySelector(".team-card-portrait[data-touch-toggle='true']");

    if (!card || !portrait) {
      return;
    }

    card.classList.toggle("is-expanded", expanded);
    portrait.setAttribute("aria-expanded", expanded ? "true" : "false");
  };

  const collapseExpandedCards = (exceptCard = null) => {
    grid.querySelectorAll(".team-card.is-expanded").forEach((card) => {
      if (card !== exceptCard) {
        setExpandedState(card, false);
      }
    });
  };

  const updateInteractionHints = () => {
    const hint = usesTouchToggle() ? "Tap image to connect" : "Hover to connect";

    grid.querySelectorAll(".team-card-meta").forEach((meta) => {
      meta.textContent = hint;
    });

    if (!usesTouchToggle()) {
      collapseExpandedCards();
    }
  };

  const renderMembers = (members) => {
    const signature = members.map((member) => [
      member.name,
      member.src,
      member.linkedin,
      member.scholar
    ].join("~")).join("|");

    if (!signature || signature === lastSignature) {
      return;
    }

    lastSignature = signature;

    const fragment = document.createDocumentFragment();

    members.forEach((member, index) => {
      const card = document.createElement("article");
      const portrait = document.createElement("div");
      const image = document.createElement("img");
      const drawer = document.createElement("div");
      const name = document.createElement("h2");
      const actions = document.createElement("div");
      const hasProfiles = Boolean(member.linkedin || member.scholar);

      card.className = "team-card";
      card.setAttribute("role", "listitem");
      card.style.setProperty("--team-index", String(index + 1));

      portrait.className = "team-card-portrait";

      image.src = member.src;
      image.alt = member.name;
      image.loading = index < 4 ? "eager" : "lazy";
      image.decoding = "async";

      drawer.className = "team-card-drawer";
      drawer.id = "team-card-drawer-" + String(index + 1);

      name.className = "team-card-name";
      name.textContent = member.name;

      if (member.linkedin) {
        actions.appendChild(createAction({
          href: member.linkedin,
          iconSrc: LINKEDIN_ICON_URL,
          label: "LinkedIn profile for " + member.name,
          modifierClass: "team-card-action--linkedin"
        }));
      }

      if (member.scholar) {
        actions.appendChild(createAction({
          href: member.scholar,
          iconSrc: SCHOLAR_ICON_URL,
          label: "Google Scholar profile for " + member.name,
          modifierClass: "team-card-action--scholar"
        }));
      }

      portrait.appendChild(image);
      drawer.appendChild(name);

      if (hasProfiles) {
        const meta = document.createElement("p");

        portrait.dataset.touchToggle = "true";
        portrait.tabIndex = 0;
        portrait.setAttribute("role", "button");
        portrait.setAttribute("aria-controls", drawer.id);
        portrait.setAttribute("aria-expanded", "false");
        portrait.setAttribute("aria-label", "Toggle profile links for " + member.name);

        meta.className = "team-card-meta";
        meta.textContent = usesTouchToggle() ? "Tap image to connect" : "Hover to connect";

        actions.className = "team-card-actions";
        actions.setAttribute("aria-label", "Profile links for " + member.name);

        drawer.appendChild(meta);
        drawer.appendChild(actions);
      }

      card.appendChild(portrait);
      card.appendChild(drawer);

      fragment.appendChild(card);
    });

    grid.replaceChildren(fragment);

    if (status) {
      status.textContent = "Loaded " + members.length + " team profiles.";
    }
  };

  grid.addEventListener("click", (event) => {
    if (!usesTouchToggle()) {
      return;
    }

    const portrait = event.target.closest(".team-card-portrait[data-touch-toggle='true']");

    if (!portrait || !grid.contains(portrait)) {
      return;
    }

    const card = portrait.closest(".team-card");
    const isExpanded = card?.classList.contains("is-expanded");

    collapseExpandedCards(card);
    setExpandedState(card, !isExpanded);
  });

  grid.addEventListener("keydown", (event) => {
    if (!usesTouchToggle() || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    const portrait = event.target.closest(".team-card-portrait[data-touch-toggle='true']");

    if (!portrait || !grid.contains(portrait)) {
      return;
    }

    event.preventDefault();

    const card = portrait.closest(".team-card");
    const isExpanded = card?.classList.contains("is-expanded");

    collapseExpandedCards(card);
    setExpandedState(card, !isExpanded);
  });

  document.addEventListener("click", (event) => {
    if (!usesTouchToggle() || event.target.closest(".team-card")) {
      return;
    }

    collapseExpandedCards();
  });

  if (typeof TOUCH_TOGGLE_QUERY.addEventListener === "function") {
    TOUCH_TOGGLE_QUERY.addEventListener("change", updateInteractionHints);
  } else if (typeof TOUCH_TOGGLE_QUERY.addListener === "function") {
    TOUCH_TOGGLE_QUERY.addListener(updateInteractionHints);
  }

  const parseDirectoryListing = (markup) => {
    const documentMarkup = new DOMParser().parseFromString(markup, "text/html");

    return Array.from(documentMarkup.querySelectorAll("a[href]"))
      .map((link) => link.getAttribute("href") || "")
      .filter((href) => /\.png$/i.test(href))
      .map((href) => decodeURIComponent(href.split("/").pop() || href))
      .filter(Boolean)
      .map((fileName) => ({
        name: toMemberName(fileName),
        src: toMemberSrc(fileName)
      }));
  };

  const loadDirectoryMembers = async () => {
    const response = await fetch(DIRECTORY_URL, { cache: "no-store" });
    if (!response.ok) {
      return [];
    }

    const contentType = response.headers.get("content-type") || "";
    if (!/text\/html|text\/plain/i.test(contentType)) {
      return [];
    }

    const markup = await response.text();
    return normalizeMembers(parseDirectoryListing(markup));
  };

  const loadManifestMembers = async () => {
    const response = await fetch(MANIFEST_URL + "?ts=" + Date.now(), { cache: "no-store" });
    if (!response.ok) {
      return [];
    }

    return normalizeMembers(await response.json());
  };

  const refreshTeam = async () => {
    const [manifestResult, directoryResult] = await Promise.allSettled([
      loadManifestMembers(),
      loadDirectoryMembers()
    ]);

    const manifestMembers = manifestResult.status === "fulfilled" ? manifestResult.value : [];
    const directoryMembers = directoryResult.status === "fulfilled" ? directoryResult.value : [];
    const members = mergeMembers(manifestMembers, directoryMembers);

    if (members.length) {
      renderMembers(members);
      return;
    }

    if (status && !lastSignature) {
      status.textContent = "Unable to load team profiles.";
    }
  };

  renderMembers(normalizeMembers(DEFAULT_MEMBERS));

  refreshTeam().catch(() => {
    if (status && !lastSignature) {
      status.textContent = "Unable to load team profiles.";
    }
  });

  window.setInterval(() => {
    refreshTeam().catch(() => {
      if (status && !lastSignature) {
        status.textContent = "Unable to load team profiles.";
      }
    });
  }, POLL_INTERVAL);

  updateInteractionHints();
})();

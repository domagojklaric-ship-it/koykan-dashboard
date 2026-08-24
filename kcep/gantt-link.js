/* Koykan KCEP - cetvrti pogled.
   Dodaje chip "Vremenski" u red LISTA, koji vodi na gantt.html.
   Ne dira nijednu postojecu funkciju dashboarda. Ako se red filtera
   ponovno iscrta, MutationObserver vrati chip na mjesto. */
(function () {
  var HREF = "gantt.html";
  var LABEL = "Vremenski";
  var MARK = "kcepGanttChip";

  function row() {
    var chips = document.querySelectorAll(".chips .chip");
    for (var i = 0; i < chips.length; i++) {
      var t = (chips[i].textContent || "").trim();
      if (t === "Ukupni projekt" || t === "Hrvatska" || t === "Njemačka") {
        return chips[i].parentElement;
      }
    }
    return null;
  }

  function add() {
    var r = row();
    if (!r) return false;
    if (r.querySelector("[data-" + MARK + "]")) return true;
    var a = document.createElement("a");
    a.className = "chip";
    a.href = HREF;
    a.textContent = LABEL;
    a.title = "Kombinirani hod kroz Hrvatsku i Njemacku, poredan po ovisnostima";
    a.setAttribute("data-" + MARK, "1");
    a.style.textDecoration = "none";
    a.style.marginLeft = "10px";
    a.style.borderColor = "var(--accent)";
    a.style.color = "var(--accent)";
    r.appendChild(a);
    return true;
  }

  function start() {
    add();
    var host = document.querySelector(".filters") || document.body;
    try {
      new MutationObserver(function () { add(); })
        .observe(host, { childList: true, subtree: true });
    } catch (e) { setInterval(add, 1500); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(start, 400); });
  } else {
    setTimeout(start, 400);
  }
})();

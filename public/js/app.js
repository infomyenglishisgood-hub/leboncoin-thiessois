/* Le strict minimum de JavaScript : le site fonctionne meme sans. */

// Galerie photo : cliquer sur une miniature change la grande image.
document.querySelectorAll('.thumb').forEach(function (thumb) {
  thumb.addEventListener('click', function () {
    const main = document.getElementById('gallery-main');
    if (!main) return;
    main.src = thumb.dataset.src;
    document.querySelectorAll('.thumb').forEach((t) => t.classList.remove('on'));
    thumb.classList.add('on');
  });
});

/**
 * Reduction des photos avant l'envoi.
 * Une photo de telephone pese 3 a 6 Mo ; on la ramene a ~200 Ko.
 * C'est essentiel avec une connexion mobile senegalaise : l'envoi passe
 * de plusieurs minutes a quelques secondes. Si le navigateur ne sait pas
 * le faire, le formulaire part normalement avec les fichiers d'origine.
 */
(function () {
  const MAX_SIDE = 1600;
  const form = document.querySelector('form[enctype="multipart/form-data"]');
  const input = form && form.querySelector('input[type="file"]');
  if (!form || !input || typeof DataTransfer === 'undefined' || !HTMLCanvasElement.prototype.toBlob) return;

  let ready = false;

  function shrink(file) {
    return new Promise(function (resolve) {
      if (!file.type.startsWith('image/') || file.size < 300 * 1024) return resolve(file);
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) {
          if (!blob || blob.size >= file.size) return resolve(file);
          resolve(new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  form.addEventListener('submit', function (e) {
    if (ready || !input.files.length) return;
    e.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button) { button.disabled = true; button.textContent = '...'; }

    Promise.all(Array.prototype.map.call(input.files, shrink))
      .then(function (files) {
        const dt = new DataTransfer();
        files.forEach(function (f) { dt.items.add(f); });
        input.files = dt.files;
      })
      .catch(function () { /* on envoie les fichiers d'origine */ })
      .then(function () { ready = true; form.submit(); });
  });
})();

// Le lien de langue conserve les filtres de la page en cours.
document.querySelectorAll('.lang-switch a').forEach(function (link) {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', new URL(link.href, window.location.origin).searchParams.get('lang'));
  link.href = url.pathname + url.search;
});

async function imgPreload(src, timeout = null) {
  let timeoutTimer = null;
  return new Promise((resolve, reject) => {
    if (timeout) {
      timeoutTimer = setTimeout(() => {
        resolve();
      }, timeout);
    }
    const img = new Image();
    img.onload = () => {
      clearTimeout(timeoutTimer);
      resolve();
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = src;
  });
}

module.exports = imgPreload;

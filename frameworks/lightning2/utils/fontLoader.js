export default (fonts) => {
    if (!fonts || !Array.isArray(fonts)) {
        return Promise.reject('No fonts provided');
    }

    if (fonts.length === 0) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        fonts.map(({ family, url, urls, descriptors }) => () => {
            const src = urls
                ? urls.map(url => {
                    return 'url(' + url + ')'
                })
                : 'url(' + url + ')'
            const fontFace = new FontFace(family, src, descriptors || {});
            document.fonts.add(fontFace);
            return fontFace.load();
    }).reduce((promise, method) => {
        return promise.then(() => method());
    }, Promise.resolve(null))
        .then(resolve)
        .catch(reject);
    })
}
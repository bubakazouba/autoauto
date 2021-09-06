function subtractIds(i2, i1) {
    let is2 = i2.split(".");
    let is1 = i1.split(".");
    // TODO: support this
    if (is1.length != is2.length) {
        return null;
    }
    let ds = [];
    for (let i = 0; i < is1.length; i++) {
        ds.push(parseInt(is2[i]) - parseInt(is1[i]));
    }
    return ds.join(".");
}

function addIds(i2, i1) {
    let is2 = i2.split(".");
    let is1 = i1.split(".");
    if (is1.length != is2.length) {
        return null;
    }
    let ds = [];
    for (let i = 0; i < is1.length; i++) {
        ds.push(parseInt(is2[i]) + parseInt(is1[i]));
    }
    return ds.join(".");
}

module.exports = {
    subtractIds: subtractIds,
    addIds: addIds,
};
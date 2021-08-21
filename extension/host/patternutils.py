def subtractIds(i2, i1):
    is2 = i2.split(".")
    is1 = i1.split(".")
    # TODO: support this
    if len(is2) != len(is1):
        return None
    ds = []
    for i in range(len(is1)):
        ds.append(str(int(is2[i])-int(is1[i])))
    return ".".join(ds)

def addIds(i2, i1):
    is2 = i2.split(".")
    is1 = i1.split(".")
    if len(is1) != len(is2):
        return None
    ds = []
    for i in range(len(is1)):
        ds.append(str(int(is2[i])+int(is1[i])))
    return ".".join(ds)
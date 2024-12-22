export function assertEq(a:any, b:any) {
    if (a !== b) {
        if (typeof(a) == 'string' && typeof(b) == 'string') {
            for (let i = 0; i < a.length; i++) {
                if (a[i] != b[i]) {
                    throw `unittest failed @(${i}): ${a[i]} != ${b[i]}`;
                }
            }
            if (a.length != b.length) {
                throw 'unittest failed: string length not match';
            }
        }
        throw `unittest failed: '${a}' !== '${b}'`;
    }
}


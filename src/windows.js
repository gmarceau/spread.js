var child = require('child_process'),
    path = require('path'),
    fs = require('fs');


const windows = {
    get isWin () {
        return /^win/.test(process.platform);
    },
    readLink: function (filename) {
        var shortcutExe = __dirname + '/../node_modules/windows-shortcuts/lib/shortcut/shortcut.exe'
        var s = child.spawnSync(shortcutExe, ['/A:Q', '/F:' + filename])
        if (s.status != 0) {
            if (s.error)
                throw s.error
            else
                throw new Error('shortcut ' + s.status + ': ' + (s.stdout && s.stdout.toString()))
        }
        return s.stdout.toString().match(/TargetPathExpanded=(.*)/)[1]
    },
    findEmacsClient: function () {
        var pathDirs = process.env['PATH'].split(';');
        for (p of pathDirs) {
            var filename = path.join(p, 'emacsclient.lnk')
            if (fs.existsSync(filename)) {
                return windows.readLink(filename)
            }
            filename = path.join(p,  'emacsclient.exe')
            if (fs.existsSync(filename)) {
                return filename
            }
        }
        throw new Error('could not find emacsclient')
    },

    _emacsclientPath: false,

    get emacsclient() {
        if (! module.exports._emacsclientPath) {
            windows._emacsclientPath = windows.findEmacsClient()
        }
        return windows._emacsclientPath
    }
}
module.exports = windows


module.exports = {
    defaultNamespace: 'translation',
    lexers: {
        ts: ['JavascriptLexer'],
        tsx: ['JsxLexer'],
        default: ['JavascriptLexer'],
    },
    locales: ['en', 'lv', 'ru'],
    output: 'locales/$LOCALE/$NAMESPACE.json', // Директория названа по имени локали а локаль по имени пространства имен
    input: ['pages/*.tsx', 'components/*/*.tsx'] // вход это все файлы TS
}

HTMLTemplateService = (function() {
    const definitionTemplate = '<div class="col-1"><p>({{num}})</p></div><div class="col-11"><p class="def-text">{{def}}</p><p>{{context}}</p></div>'
    const wordTemplate = '<li id="word-{{word}}" class="row word-div"><h3 class="word-text">{{word}}</h3>{{definitions}}</li>'

    function getWordHTML(wordObj) {
        var definitionsHTML = ''
        for (const [definitionIndex, defintionObj] of wordObj.definitions.entries()) {
            var contextStr = buildContextString(defintionObj.context)
            definitionsHTML += definitionTemplate.replaceAll('{{num}}', definitionIndex + 1)
                .replaceAll('{{def}}', defintionObj.definition.replaceAll('\n\n', '<br>'))
                .replaceAll('{{context}}', contextStr)

        }

        var wordHTML = wordTemplate.replaceAll("{{word}}", wordObj.word)
            .replaceAll('{{definitions}}', definitionsHTML)

        return wordHTML
    }

    function buildContextString(contextObj) {
        var types = contextObj.types.sort().slice(0, 3).join(', ')
        if (contextObj.types.length > 3) {
            types += ', and ' + (contextObj.types.length - 3) + ' more'
        }
        var tags = contextObj.tags.sort().slice(0, 3).join(', ')
        if (contextObj.tags.length > 3) {
            tags += ', and ' + (contextObj.tags.length - 3) + ' more'
        }
        var paths = contextObj.paths.sort().slice(0, 3).join(', ')
        if (contextObj.paths.length > 3) {
            paths += ', and ' + (contextObj.paths.length - 3) + ' more'
        }
        var classes = contextObj.classes.sort().slice(0, 3).join(', ')
        if (contextObj.classes.length > 3) {
            classes += ', and ' + (contextObj.classes.length - 3) + ' more'
        }

        var contextStr = '';
        if (types) { contextStr += types }
        // if (tags) { contextStr += " | " + tags }
        if (classes) {
            if (contextObj.classes.length == 1) {
                contextStr += " <br> Class: " + classes
            } else {
                contextStr += " <br> Classes: " + classes
            }
        }
        if (paths) {
            if (contextObj.paths.length == 1) {
                contextStr += " <br> Endpoint: " + paths
            } else {
                contextStr += " <br> Endpoints: " + paths
            }
        }

        return contextStr
    }

    return {
        getWordHTML: getWordHTML
    };
})();
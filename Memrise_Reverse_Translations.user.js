// ==UserScript==
// @name           Memrise Reverse Translations
// @namespace      https://github.com/cooljingle
// @description    Reverse testing direction when using Memrise
// @match          https://www.memrise.com/course/*/garden/*
// @match          https://www.memrise.com/garden/review/*
// @version        0.0.11
// @updateURL      https://github.com/cooljingle/memrise-reverse-translations/raw/master/Memrise_Reverse_Translations.user.js
// @downloadURL    https://github.com/cooljingle/memrise-reverse-translations/raw/master/Memrise_Reverse_Translations.user.js
// @grant          none
// ==/UserScript==
$(document).ready(function() {

    var localStorageIdentifier = "memrise-reverse-translations",
        reversedCourses = JSON.parse(localStorage.getItem(localStorageIdentifier)) || [];
    $('#left-area').append("<a id='reverse-translations'></a>");

    MEMRISE.garden.session_start = (function() {
        var cached_function = MEMRISE.garden.session_start;
        return function() {
            enableReverseTranslations();
            return cached_function.apply(this, arguments);
        };
    }());

    function enableReverseTranslations() {
        var courseId,
            element = $('#reverse-translations'),
            isReversed;

        element.click(function() {
            isReversed = !isReversed;
            setReversedState(true);
        });

        MEMRISE.garden.session.box_factory.make = (function () {
            var cached_function = MEMRISE.garden.session.box_factory.make;
            return function () {
                courseId = MEMRISE.garden.session.course_id || (arguments[0].learnable_id && MEMRISE.garden.session_data.learnables_to_courses[arguments[0].learnable_id]);
                if(courseId){
                    isReversed = reversedCourses.indexOf(courseId) > -1;
                    setReversedState();
                }
                var result = cached_function.apply(this, arguments);
                if(result.template.endsWith('multiple_choice'))
                    result.template = `${isReversed ? 'reversed_' : ''}multiple_choice`;
                return result;
            };
        }());

        MEMRISE.garden.session.make_box = (function () {
            var cached_function = MEMRISE.garden.session.make_box;
            return function () {
                var result = cached_function.apply(this, arguments);
                if(isReversed && result.template === "typing") {
                    [result.learnable.item, result.learnable.definition] = [result.learnable.definition, result.learnable.item];
                    if(result.testData.correct[0] === result.learnable.item.value)
                        result.testData.correct[0] = result.learnable.definition.value;
                    else if(result.testData.correct[0] === result.learnable.definition.value)
                        result.testData.correct[0] = result.learnable.item.value;

                    if(result.prompt === result.learnable.item.value)
                        result.prompt  = result.learnable.definition.value;
                    else if(result.prompt  === result.learnable.definition.value)
                        result.prompt = result.learnable.item.value;
                }
                return result;
            };
        }());

        function setReversedState(setStorage) {
            if(isReversed) {
                if(setStorage) {
                    reversedCourses.push(courseId);
                    localStorage.setItem(localStorageIdentifier, JSON.stringify(reversedCourses));
                }
                element.text("Un-reverse translations")
                    .attr("title", "Un-reverse testing direction for this course");
            } else {
                if(setStorage) {
                    reversedCourses.splice(reversedCourses.indexOf(courseId), 1);
                    localStorage.setItem(localStorageIdentifier, JSON.stringify(reversedCourses));
                }
                element.text("Reverse translations")
                    .attr("title", "Reverse testing direction for this course");
            }
        }
    }
});

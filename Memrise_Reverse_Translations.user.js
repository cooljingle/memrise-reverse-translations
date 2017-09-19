// ==UserScript==
// @name           Memrise Reverse Translations
// @namespace      https://github.com/cooljingle
// @description    Reverse testing direction when using Memrise
// @match          https://www.memrise.com/course/*/garden/*
// @match          https://www.memrise.com/garden/review/*
// @version        0.0.5
// @updateURL      https://github.com/cooljingle/memrise-reverse-translations/raw/master/Memrise_Reverse_Translations.user.js
// @downloadURL    https://github.com/cooljingle/memrise-reverse-translations/raw/master/Memrise_Reverse_Translations.user.js
// @grant          none
// ==/UserScript==
$(document).ready(function() {

    var localStorageIdentifier = "memrise-reverse-translations",
        reversedCourses = JSON.parse(localStorage.getItem(localStorageIdentifier)) || [];
    $('#left-area').append("<a id='reverse-translations'></a>");

    MEMRISE.garden.boxes.load = (function() {
        var cached_function = MEMRISE.garden.boxes.load;
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

        _.each(MEMRISE.garden.box_types, function (box_type) {
            box_type.prototype.activate = (function () {
                var cached_function = box_type.prototype.activate;
                return function () {
                    courseId = MEMRISE.garden.session.course_id || MEMRISE.garden.session_data.things_to_courses[this.thinguser.thing_id];
                    isReversed = reversedCourses.indexOf(courseId) > -1;
                    var didReverse = false;
                    if(this instanceof MEMRISE.garden.box_types.TestBox) {
                        if(isReversed && this.promptWith === "text" && this.testKind === "text") {
                            didReverse = true;
                            [this.learnable.item, this.learnable.definition] = [this.learnable.definition, this.learnable.item];
                            [this.correct, this.prompt] = [this.prompt, this.correct];
                            _.filter(this.choices, c => c.correct).forEach(c => c.choice = c.choice_html = this.correct);
                        }
                    }
                    var result = cached_function.apply(this, arguments);
                    if(didReverse)
                        [this.learnable.item, this.learnable.definition] = [this.learnable.definition, this.learnable.item];
                    setReversedState();
                    return result;
                };
            }());
        });
    }
});

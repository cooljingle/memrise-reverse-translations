// ==UserScript==
// @name           Memrise Reverse Translations
// @namespace      https://github.com/cooljingle
// @description    Reverse testing direction when using Memrise
// @match          https://www.memrise.com/course/*/garden/*
// @match          https://www.memrise.com/garden/review/*
// @version        0.0.7
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

        MEMRISE.garden.box_mapping.multiple_choice = MEMRISE.garden.box_mapping.reversed_multiple_choice = (function(){
            var mc = MEMRISE.garden.box_types.MultipleChoiceBox;
            var rmc = MEMRISE.garden.box_types.ReversedMultipleChoiceBox;
            return function() {
                if(isReversed){
                    arguments[0].template = "reversed_multiple_choice";
                    return new rmc(...arguments);
                } else {
                    arguments[0].template = "multiple_choice";
                    return new mc(...arguments);
                }
            };
        }());

        element.click(function() {
            isReversed = !isReversed;
            setReversedState(true);
        });

        MEMRISE.garden.session.box_factory.make = (function () {
            var cached_function = MEMRISE.garden.session.box_factory.make;
            return function () {
                courseId = MEMRISE.garden.session.course_id || MEMRISE.garden.session_data.things_to_courses[MEMRISE.garden.learnables[arguments[0].learnable_id].thing_id];
                isReversed = reversedCourses.indexOf(courseId) > -1;
                setReversedState();
                return cached_function.apply(this, arguments);
            };
        }());

        MEMRISE.garden.box_types.TypingTestBox.prototype.activate = (function () {
            var cached_function = MEMRISE.garden.box_types.TypingTestBox.prototype.activate;
            return function () {
                if(isReversed) {
                    [this.learnable.item, this.learnable.definition] = [this.learnable.definition, this.learnable.item];
                    [this.correct, this.prompt] = [this.prompt, this.correct];
                    this.accepted = [this.correct];
                }
                var result = cached_function.apply(this, arguments);
                if(isReversed)
                    [this.learnable.item, this.learnable.definition] = [this.learnable.definition, this.learnable.item];
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

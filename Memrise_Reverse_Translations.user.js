// ==UserScript==
// @name           Memrise Reverse Translations
// @namespace      https://github.com/cooljingle
// @description    Reverse testing direction when using Memrise
// @match          http://www.memrise.com/course/*/garden/*
// @match          http://www.memrise.com/garden/review/*
// @version        0.0.3
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

        function swapColumns(obj) {
            var temp = obj.column_a;
            obj.column_a = obj.column_b;
            obj.column_b = temp;
        }

        MEMRISE.garden.session.box_factory.make = (function() {
            var cached_function = MEMRISE.garden.session.box_factory.make;
            return function() {
                var result = cached_function.apply(this, arguments);
                courseId = this.session.course_id || MEMRISE.garden.session_data.thinguser_course_ids[result.thing_id + "-" + result.column_a + "-" + result.column_b];
                isReversed = reversedCourses.indexOf(courseId) > -1;
                if(isReversed && !result.isReversed) {
                    swapColumns(result);
                    result.isReversed = true;
                }
                setReversedState();
                return result;
            };
        }());

        MEMRISE.garden.register = (function() {
            var cached_function = MEMRISE.garden.register;
            return function() {
                var a = arguments[0];
                if(a.box_dict.isReversed) {
                    a.thinguser = this.thingusers.get(a.thing_id, a.column_b, a.column_a);
                    swapColumns(a);
                    swapColumns(a.box_dict);
                }
                return cached_function.apply(this, arguments);

            };
        }());
    }
});

var $banner, $cels,
        cels = [],
        displayedCells = {},
        theme = 'happy',
        wordbanks = {
            happy: ['understanding', 'great', 'playful', 'calm', 'confident', 'gay', 'courageous', 'peaceful', 'reliable', 'joyous', 'energetic', 'at ease', 'easy', 'lucky', 'liberated', 'comfortable', 'amazed', 'fortunate', 'optimistic', 'pleased', 'free', 'delighted', 'provocative', 'encouraged', 'sympathetic', 'overjoyed', 'impulsive', 'clever', 'interested', 'gleeful', 'free', 'surprised', 'satisfied', 'thankful', 'frisky', 'content', 'receptive', 'important', 'animated', 'quiet', 'accepting', 'festive', 'spirited', 'certain', 'kind', 'ecstatic', 'thrilled', 'relaxed', 'satisfied', 'wonderful', 'serene', 'glad', 'free and easy', 'cheerful', 'bright', 'sunny', 'blessed', 'merry', 'reassured']
        },
                lock = false,
        fetchTimeout = false;

/*
 function reset() {
 $cels.css('opacity', 0);
 displayedCells = {};
 $banner.animate({
 opacity: 0
 }, function() {
 $banner.html('').css({
 opacity: 1
 })
 });
 }
 function showCel(i) {
 var text;
 if (displayedCells.hasOwnProperty(i) == false) {
 displayedCells[i] = cels[i];
 text = wordbanks[theme][i];
 cels[i].text(text);
 cels[i].animate({
 opacity: 1
 }, function() {
 var $span = $('<span>' + text + ' </span>');
 $banner.append($span);
 $span.fadeIn(500)
 });
 }
 }
 function fetchShowlist() {
 clearTimeout(fetchTimeout);
 if (!lock) {
 $.ajax({
 url: 'showlist.php',
 success: showlist_cb,
 complete: function() {
 lock = false;
 }
 });
 lock = true;
 }
 fetchTimeout = setTimeout(fetchShowlist, 1000);
 }
 function showlist_cb(e) {
 var j, showList;
 try {
 showList = e.split(',');
 console.log('showList.length  ' + showList.length, showList);
 if (showList.length == 1 && showList[0] == '') {
 reset();
 } else {
 showList.pop();
 if (j)
 showList.push(j);
 for (j = 0; j < showList.length; j++) {
 showCel(showList[j]);
 }
 }
 } catch (e) {
 console.log(e);
 }
 }
 */


Collection = {};
Collection.Cel = Backbone.Collection.extend({
    model: Model.Cel
});


$(document).ready(function() {
    $('#orange-snippets').addSnippet();
    target = new Model.Target();
    board = new Model.Board({$el: $('#board'), target: target});

    pageView = new View.Page({el: $('body')[0], model: board});
    /*$cels = $('div.w-cel');
    $cels.each(function(i) {
        cels[i] = $(this);
    });
    $banner = $('#banner');*/
    board.set('mode', 'setup');
    //fetchShowlist();
    
    function test(id) {
        var tests = {
            "1": function() {
                console.log('Setting up calibration::: setTarget(200,400); board.calculateOffset(); setTarget(400, 0); board.calculateMultiplier(); setTarget(200, 200);')
                setTarget(200,400); board.calculateOffset(); setTarget(400, 0); board.calculateMultiplier(); setTarget(200, 200);
            }
        }
        tests[id]();
    }
});


/*
 * How will this work?
 *
 * Tracking is a point object that returns the server's current 'point'
 * Calibration holds the server's points for max and min
 * Board holds it's own max/min corrdinates
 *  screen max/min
 *  calibration
 *      min {
 *          screen: {
 *              x:
 *              y:
 *          }
 *          camera: {
 *              x:
 *              y:
 *          }
 *      }
 *      camera max/min (that maps to the board's corners)
 *  cels - a collection of cels
 *
 * Everything is a box
 *  min:
 *
 *
 *  So, if I click on a Board corner, and that corner then says
 *  "I know what my camera min is"
 *  It can take that camera min, and create the offset
 *  1. Subtract this value (min) from all camera values
 *  "I know what my camera max is"
 *  It can take that camera max and create the multiplier
 *  1. Subtract (min) from the camera value.
 *  2. Subtract $ derived screen min from $ derived screen max
 *  3. Take 2./camera.now - that is your multiplier ratio
 *  4. Add back screen min those are your screen coordinates
 *
 *  Ok dude. it's time for you to modify the python script to only output those two values.
 *  Then wire up the tracking point to the coordinates. You don't need to worry about calibration until that's working
 *  After that's working, THEN wire up calibration. Should be easy the code's already written, and you can easily see (with that orange dot) if it's going to go well.
 *  once that's running, you can do the 'hotzone' thing with the cornder boxes.
 *
 */
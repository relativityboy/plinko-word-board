<?php
$pegs = 36;
$rowPegCount = array(4, 5);
$tableStructure = array();
$pegCount = 0;
$rowPointer = 1;
$currentRow = false;
for ($i = 0; $i < $pegs; $i++) {
    if ($pegCount == 0) {
        $rowPointer = ($rowPointer < (count($rowPegCount) - 1) ) ? $rowPointer + 1 : 0;
        //print_r((count($rowPegCount) - 1)); print("\n");
        //print_r($rowPointer); print("\n");

        $pegCount = $rowPegCount[$rowPointer];
        $currentRow = array();
    }
    $currentRow[] = $i + 1;
    //print_r($currentRow); print("\n");
    $pegCount--;
    if ($pegCount == 0 || $i == ($pegs - 1)) {
        $tableStructure[] = $currentRow;
    }
}
?>
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title></title>
        <style type="text/css">

        </style>
        <link type="text/css" rel="stylesheet" href="css/main.css"/>
        <script type='text/javascript' src="js/jquery.js"></script>
        <script type='text/javascript'>
            appRoot = '/';
        </script>
        <script type='text/javascript' src="js/jquery-ui-1.10.4.custom.js"></script>
        <script type='text/javascript' src="js/underscore.js"></script>
        <script type='text/javascript' src="js/backbone.js"></script>
        <script type='text/javascript' src="js/jquery.orange.js"></script>
        <script type='text/javascript' src="js/model.js"></script>
        <script type='text/javascript' src="js/view.js"></script>
        <script type='text/javascript' src="js/main.js"></script>
    </head>
    <body>
        <div id='board' class="board" tabindex="0">
            <div id='setup-banner' class='w-setup-banner setup-banner'>SETUP</div>
            <div id="word-banner" class="w-word-banner word-banner">
                <div class='w-hotzone reset-hotzone'></div>
                <div class='w-text-display text-display'><span>some text</span> some more text</div>
            </div>

            <div class='w-calibration-point-min calibration-point'></div>
            <div class='w-calibration-point-max calibration-point'></div>
            <div class='w-calibration-point-target calibration-point calibration-point-circle' style="z-index:2000"></div>
        </div>
        <div class="w-mode-setup show-controlpanel">enter setup</div>
        <div class="w-controlpanel controlpanel">
            <a href="#" class="w-mode-switch btn-hide-settings" data-val='run'>run</a>
            <a href="#" class="w-mode-switch btn-hide-settings" data-val='test'>test</a>
            <div class="w-configuration">
                <h4 class='subheader'>Board Config
                    <input class='w-save-config btn' type='button' value='Save'/>
                    <input class='w-load-config btn' type='button' value='Load'/>
                </h4>
                <ul>
                    <li><span class='inline-h4'>height</span><input class="w-board-height" value=''/></li>
                    <li><label class='inline-h4'>width</label><input class="w-board-width" value=''/></li>
                </ul>
            </div>
            <div class="w-calibration">
                <h4 class='subheader'>Calibration <!--span class='w-calibration-status calibration-status'>active</span><input class='w-toggle-calibration btn' type='button' value='enable calibration'--></h4>
                <div class='w-corner-confirm-panel'>
                    <ul>
                        <li><span class='inline-h4'><input class='w-tracking-ctrl' type='button' value='disable tracking'/></span> <span style='float:right'>x:<span class='w-x'></span>, y:<span class='w-y'></span></span></li>
                        <li><span class='inline-h4'><input class='w-set-min w-calibration-ctrl' type='button' value='set top left'/></span></li>
                        <li><span class='inline-h4'><input class='w-set-max w-calibration-ctrl' type='button' value='set bot right'/></span></li>
                    </ul>
                </div>
            </div>
            <div>
                <h4 class='subheader'>Cels <input class='w-add-cel btn' type='button' value='Add Cel'>
                </h4>
                <div>
                    <input class="w-calculate-camera-coordinates" type='button' value='Calc Server Coords'>
                    <input class='w-toggle-collision-detection' type='button' value='Enable Coll Detection'/></div>
            </div>
            <div class="w-testing">
                <h4 class='subheader'>Testing
                    <input class='w-test-calibration btn' type='button' data-value='1' value='Calib 1'/>
                    <input class='w-test-calibration btn' type='button' data-value='2' value='Calib 2'/>

                </h4>
                <ul>
                    <li><span class='inline-h4'>Cam Y</span><input class="w-test-cam-y" type='number' value='0'/></li>
                    <li><label class='inline-h4'>Cam X</label><input class="w-test-cam-x" type='number' value='0'/></li>
                </ul>
            </div>
            <div class="w-configuration">
                <h4 class='subheader'>Wordbank
                    <input class='w-load-wordbanks btn' type='button' value='Load'/>
                </h4>
            </div>
        </div>
        <script id='orange-snippets' type='text/html'>
            {#snippet name="peg"}
            <div id='cel__{id}' class='peg w-draggable' style='left:{attributes.screen.min.x}px; top:{attributes.screen.min.y}px;'>
                <div class='w-hotzone peg-hotzone'></div>
                <div class='peg-text-display-wrapper'>
                    <div class='w-text-display peg-text-display'>{id}</div>
                </div>
            </div>
            {/snippet}
        </script>
    </body>
</html>
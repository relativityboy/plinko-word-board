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
			appRoot = '/northernspark/';
		</script>
                <script type='text/javascript' src="js/jquery-ui-1.10.4.custom.js"></script>

		<script type='text/javascript' src="js/underscore.js"></script>
		<script type='text/javascript' src="js/backbone.js"></script>
		<script type='text/javascript' src="js/jquery.orange.js"></script>
		<script type='text/javascript' src="js/model.js"></script>
                <script type='text/javascript' src="js/view.js"></script>
                <script type='text/javascript' src="js/main.js"></script>
	</head>
	<body><div id='board' class="board">
			<div id="banner" class="banner"></div>
			<table>
	<?php
	foreach ($tableStructure as $tr) {
		?><tr><td align="center"><?php
				foreach ($tr as $cel) {
			?><div id='cel_<?php print($cel); ?>' class='w-cel cel'><?php print($cel); ?></div><?php
			}
		?></td></tr><?php
					}
	?>
			</table>
                        <div class='w-calibration-point-min calibration-point'></div>
                        <div class='w-calibration-point-max calibration-point'></div>
                        <div class='w-calibration-point-target calibration-point calibration-point-circle' style="z-index:2000"></div>
		</div>
		<div class="w-show-controlpanel show-controlpanel"></div>
		<div class="w-controlpanel controlpanel">
                    <a href="#" class="w-hide-settings btn-hide-settings">hide</a>
                    <div class="w-calibration">
                        <h4 class='calibration'>Calibration <span class='w-calibration-status calibration-status'>active</span><input class='w-toggle-calibration btn' type='button' value='enable calibration'></h4>
                        <div class='w-corner-confirm-panel'>
                            <ul>
                                <li><span class='inline-h4'>tracking: </span>x:<span class='w-x'></span>, y:<span class='w-y'></span></li>
                                <li><span class='inline-h4'><input class='w-set-min w-calibration-ctrl' type='button' value='set upper left' disabled/></span></li>
                                <li><span class='inline-h4'><input class='w-set-max w-calibration-ctrl' type='button' value='set lower right' disabled/></span></li>
                            </ul>
                        </div>
                    </div>
                    <div>
                        <h4 class='calibration'>Cels <input class='w-add-cel btn' type='button' value='Add Cel'><input class='w-save-cels btn' type='button' value='Save Cels'/>
                            <input class='w-load-cels btn' type='button' value='Load Cels'/></h4>
                        <div>
                            <input class="w-calculate-camera-coordinates" type='button' value='Calc Server Coords'>
                            <input class='w-toggle-collision-detection' type='button' value='Enable Coll Detection'/></div>
                    </div>
		</div>
                <script id='orange-snippets' type='text/html'>
                    {#snippet name="peg"}
                    <div id='cel__{id}' class='peg w-draggable' style='left:{attributes.screen.min.x}px; top:{attributes.screen.min.y}px;'>
                        <div class='w-hotzone peg-hotzone'></div>
                        <div class='peg-text-display-wrapper'>
                            <div class='peg-text-display'>{id}</div>
                        </div>
                    </div>
                    {/snippet}
                </script>
	</body>
</html>
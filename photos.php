[
<?php
$dirpath = getcwd() . "/cslib/media";
$list = array();
if (is_dir($dirpath)) {
	if ($dir = opendir($dirpath)) {
		while (($file = readdir($dir)) !== false) {
			if (substr($file, 0, 1) != '.') {
				$list[] = "\"cslib/media/$file\"";
			}
		}
		closedir($dir);
	}
	print implode(',', $list);
}
?>
]
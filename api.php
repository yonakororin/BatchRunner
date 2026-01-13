<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$action = $_GET['action'] ?? '';
$path = $_GET['path'] ?? '';

if (!$path) {
    echo json_encode(['error' => 'Path is required']);
    exit;
}

if (!is_dir($path)) {
    echo json_encode(['error' => 'Directory not found']);
    exit;
}

$scriptPath = rtrim($path, '/') . '/webrunner.sh';

if ($action === 'scan') {
    if (!file_exists($scriptPath)) {
        echo json_encode(['found' => false]);
        exit;
    }

    $content = file_get_contents($scriptPath);
    $params = [];
    $logFile = 'output.log'; // default

    // Parse params: # @param VAR_NAME TYPE "Label" "Options"
    if (preg_match_all('/# @param\s+(\w+)\s+(\w+)\s+"([^"]+)"(?:\s+"([^"]+)")?/', $content, $matches, PREG_SET_ORDER)) {
        foreach ($matches as $match) {
            $params[] = [
                'var' => $match[1],
                'type' => strtolower($match[2]),
                'label' => $match[3],
                'options' => isset($match[4]) ? explode(',', $match[4]) : []
            ];
        }
    }

    // Parse log: # @log filename
    if (preg_match('/# @log\s+(.+)/', $content, $match)) {
        $logFile = trim($match[1]);
    }

    echo json_encode([
        'found' => true,
        'params' => $params,
        'logFile' => $logFile
    ]);
    exit;
}

if ($action === 'list') {
    $currentPath = $path ? rtrim($path, '/') : getcwd();
    
    if (!is_dir($currentPath)) {
        $currentPath = getcwd();
    }

    $directories = [];
    $items = scandir($currentPath);
    
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        
        $fullPath = $currentPath . '/' . $item;
        if (is_dir($fullPath)) {
            $hasRunner = file_exists($fullPath . '/webrunner.sh');
            $directories[] = [
                'name' => $item,
                'path' => $fullPath,
                'hasRunner' => $hasRunner
            ];
        }
    }

    echo json_encode([
        'current' => $currentPath,
        'parent' => dirname($currentPath),
        'items' => array_values($directories)
    ]);
    exit;
}

if ($action === 'run') {
    $data = json_decode(file_get_contents('php://input'), true);
    $args = $data['args'] ?? [];
    
    // Create log file if it doesn't exist
    $logFile = $data['logFile'] ?? 'output.log';
    $fullLogPath = rtrim($path, '/') . '/' . $logFile;
    if (file_exists($fullLogPath)) {
        file_put_contents($fullLogPath, ""); // Clear previous log
    } else {
        touch($fullLogPath);
    }

    // Construct command
    $cmd = "cd " . escapeshellarg($path) . " && ";
    foreach ($args as $key => $value) {
        // Enforce basic alphanumeric for keys for safety
        if (preg_match('/^[a-zA-Z0-9_]+$/', $key)) {
            $cmd .= "export " . $key . "=" . escapeshellarg($value) . "; ";
        }
    }
    
    // Run via nohup
    $cmd .= "nohup ./webrunner.sh >/dev/null 2>&1 < /dev/null &";
    
    exec($cmd);
    
    echo json_encode(['status' => 'started', 'cmd' => $cmd]);
    exit;
}

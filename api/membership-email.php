<?php
/**
 * Membership Application Email Endpoint
 *
 * Receives membership application submissions and sends email notifications via Mailtrap SMTP
 */

// Load configuration
if (!file_exists(__DIR__ . '/config.php')) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server configuration error. Please contact the administrator.'
    ]);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/vendor/SMTPMailer.php';
require_once __DIR__ . '/templates/email-templates.php';

// Enable error reporting in debug mode
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Set JSON response header
header('Content-Type: application/json');

// Handle CORS
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 86400');
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed. Use POST.'
    ]);
    exit;
}

// Get JSON input
$json_input = file_get_contents('php://input');
$data = json_decode($json_input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid JSON data'
    ]);
    exit;
}

// Validate required fields
$required_fields = ['name', 'email', 'phone', 'business_type'];
$missing_fields = [];

foreach ($required_fields as $field) {
    if (!isset($data[$field]) || trim($data[$field]) === '') {
        $missing_fields[] = $field;
    }
}

if (!empty($missing_fields)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Missing required fields: ' . implode(', ', $missing_fields)
    ]);
    exit;
}

// Validate email format
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid email address'
    ]);
    exit;
}

// Validate field lengths
if (strlen($data['name']) < 2) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Name must be at least 2 characters'
    ]);
    exit;
}

// Validate phone format (basic validation)
$phone = preg_replace('/[^0-9+]/', '', $data['phone']);
if (strlen($phone) < 10) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid phone number'
    ]);
    exit;
}

// Validate optional message length
if (isset($data['message']) && strlen($data['message']) > 500) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Message must be 500 characters or less'
    ]);
    exit;
}

try {
    // Generate email content
    $email_content = generateMembershipApplicationEmail($data);

    // Initialize SMTP mailer
    $mailer = new SMTPMailer(
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        FROM_EMAIL,
        FROM_NAME
    );

    // Send email
    $success = $mailer->send(
        ADMIN_EMAIL,
        "New Membership Application: " . $data['name'],
        $email_content['html'],
        $email_content['text']
    );

    if ($success) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Email sent successfully'
        ]);
    } else {
        $errors = $mailer->getErrors();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to send email',
            'details' => DEBUG_MODE ? $errors : null
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error occurred',
        'details' => DEBUG_MODE ? $e->getMessage() : null
    ]);
}

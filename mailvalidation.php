<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Prevent any PHP warnings or notices from breaking response headers
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Load PHPMailer classes from existing project structure
require_once __DIR__ . '/phpmailer/src/Exception.php';
require_once __DIR__ . '/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/phpmailer/src/SMTP.php';

// Detect whether the request is AJAX or standard POST submission
$isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
    || (isset($_POST['ajax']) && $_POST['ajax'] === '1')
    || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);

/**
 * Send consistent response back to the client.
 */
function sendResponse(bool $success, string $message, int $statusCode, bool $isAjax): void
{
    if ($isAjax) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'status'  => $success ? 'success' : 'error',
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Standard redirect back to contact.html with status
    $statusParam = $success ? 'success' : 'error';
    header("Location: contact.html?status={$statusParam}");
    exit;
}

// 1. Validate request method (POST only)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Invalid request method. Only POST is accepted.', 405, $isAjax);
}

// 2. Read and trim submitted form fields
$name            = trim((string)($_POST['name'] ?? ''));
$phone           = trim((string)($_POST['phone'] ?? ''));
$email           = trim((string)($_POST['email'] ?? ''));
$requirementType = trim((string)($_POST['requirement_type'] ?? ''));
$message         = trim((string)($_POST['message'] ?? ''));

// 3. Server-side validation
// Required fields: name, phone, requirement_type, message
if ($name === '') {
    sendResponse(false, 'Please enter your full name.', 400, $isAjax);
}

if ($phone === '') {
    sendResponse(false, 'Please enter your phone number.', 400, $isAjax);
}

if ($requirementType === '') {
    sendResponse(false, 'Please select your requirement type.', 400, $isAjax);
}

if ($message === '') {
    sendResponse(false, 'Please enter your message.', 400, $isAjax);
}

// Email is optional, but if entered it must be valid
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(false, 'Please enter a valid email address.', 400, $isAjax);
}

// Prevent header injection
if (preg_match('/[\r\n]/', $name) || ($email !== '' && preg_match('/[\r\n]/', $email))) {
    sendResponse(false, 'Invalid characters detected in form submission.', 400, $isAjax);
}

// Clean requirement type / subject for email
$cleanRequirement = trim(str_replace(["\r", "\n"], ' ', $requirementType));

// Optional Google Apps Script lead synchronization (non-blocking)
$googleScriptURL = 'https://script.google.com/macros/s/AKfycbx741MnVxRiGiyKzLSJouAojU2-VcmMlEMtVhQayV9NdUy63VM3PIn8ln1yHGYSnxgy/exec';
if (!empty($googleScriptURL) && function_exists('curl_init')) {
    $domainName = $_SERVER['HTTP_HOST'] ?? 'Unknown Domain';
    if (empty($domainName) && isset($_SERVER['HTTP_REFERER'])) {
        $domainName = parse_url($_SERVER['HTTP_REFERER'], PHP_URL_HOST) ?: 'Unknown Domain';
    }

    $leadData = [
        'domain'           => $domainName,
        'name'             => $name,
        'email'            => $email !== '' ? $email : 'Not provided',
        'phone'            => $phone,
        'mobile_no'        => $phone,
        'requirement_type' => $cleanRequirement,
        'subject'          => $cleanRequirement,
        'message'          => $message
    ];

    $ch = curl_init($googleScriptURL);
    if ($ch !== false) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $leadData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 2);
        @curl_exec($ch);
        curl_close($ch);
    }
}

// 4. Send email via PHPMailer using Gmail SMTP
$mail = new PHPMailer(true);

try {
    // Gmail SMTP Configuration
    $mail->SMTPDebug   = 0;
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'info.skcinfotech@gmail.com';
    $mail->Password   = 'nphyiypykjdngkuo';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->CharSet    = 'UTF-8';
    $mail->Timeout    = 8;

    // Sender: info.skcinfotech@gmail.com
    $mail->setFrom('info.skcinfotech@gmail.com', 'SB Shola Wood Flowers Website');

    // Recipient: Send all contact form submissions to info.skcinfotech@gmail.com
    $mail->addAddress('pritichakraborty574@gmail.com');

    // Reply-To: If visitor provided an email, set Reply-To
    if ($email !== '') {
        $mail->addReplyTo($email, $name);
    }

    // Email Subject & HTML Format
    $mail->isHTML(true);
    $mail->Subject = 'New Website Enquiry - SB Shola Wood Flowers';

    // Sanitize values for HTML email display
    $safeName            = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $safePhone           = htmlspecialchars($phone, ENT_QUOTES, 'UTF-8');
    $safeEmail           = htmlspecialchars($email !== '' ? $email : 'Not provided', ENT_QUOTES, 'UTF-8');
    $safeRequirementType = htmlspecialchars($cleanRequirement, ENT_QUOTES, 'UTF-8');
    $safeMessage         = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));

    // HTML Email Body
    $mail->Body = "
        <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; background-color: #ffffff;'>
            <div style='border-bottom: 2px solid #78472a; padding-bottom: 12px; margin-bottom: 20px;'>
                <h2 style='color: #78472a; margin: 0 0 4px 0; font-size: 20px;'>SB Shola Wood Flowers</h2>
                <span style='font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px;'>New Website Contact Form Submission</span>
            </div>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>
                <tr>
                    <td style='padding: 8px 0; width: 150px; color: #666; font-weight: bold;'>Full Name:</td>
                    <td style='padding: 8px 0; color: #222;'>{$safeName}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; width: 150px; color: #666; font-weight: bold;'>Phone Number:</td>
                    <td style='padding: 8px 0; color: #222;'>{$safePhone}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; width: 150px; color: #666; font-weight: bold;'>Email Address:</td>
                    <td style='padding: 8px 0; color: #222;'>{$safeEmail}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; width: 150px; color: #666; font-weight: bold;'>Requirement Type:</td>
                    <td style='padding: 8px 0; color: #222;'>{$safeRequirementType}</td>
                </tr>
            </table>
            <div style='background-color: #fbf9f6; border-left: 4px solid #78472a; padding: 16px; border-radius: 4px; margin-bottom: 20px;'>
                <strong style='display: block; color: #78472a; margin-bottom: 8px;'>Message:</strong>
                <p style='margin: 0; color: #333;'>{$safeMessage}</p>
            </div>
            <hr style='border: none; border-top: 1px solid #eeeeee; margin: 20px 0;'>
            <p style='font-size: 12px; color: #999; margin: 0;'>This inquiry was submitted from the SB Shola Wood Flowers website contact form.</p>
        </div>
    ";

    // Plain-Text Alternative Body
    $altEmailText  = $email !== '' ? $email : 'Not provided';
    $mail->AltBody = "New Website Enquiry - SB Shola Wood Flowers\n\n"
                   . "Full Name: {$name}\n"
                   . "Phone Number: {$phone}\n"
                   . "Email Address: {$altEmailText}\n"
                   . "Requirement Type: {$cleanRequirement}\n\n"
                   . "Message:\n"
                   . "{$message}\n\n"
                   . "Submitted via SB Shola Wood Flowers website contact form.";

    // Send the email with fallback authentication
    try {
        $mail->send();
    } catch (Exception $authEx) {
        if (strpos($mail->ErrorInfo, 'Could not authenticate') !== false) {
            $mail->smtpClose();
            $mail->Username = 'pritichakraborty574@gmail.com';
            $mail->Password = 'nphyiypykjdngkuo';
            $mail->send();
        } else {
            throw $authEx;
        }
    }

    // Success response: redirect back to contact.html with status=success (or JSON for AJAX)
    sendResponse(true, 'Your enquiry has been sent successfully.', 200, $isAjax);

} catch (Exception $e) {
    // Record internal error without exposing sensitive details or credentials
    error_log('PHPMailer error: ' . $mail->ErrorInfo);

    // Error response: redirect back to contact.html with status=error (or JSON for AJAX)
    sendResponse(false, 'Unable to send enquiry. Please try again later.', 500, $isAjax);
}

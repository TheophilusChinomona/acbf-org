<?php
/**
 * Simple SMTP Mailer
 *
 * A lightweight SMTP email sender for Mailtrap (and other SMTP services)
 * No external dependencies required
 */

class SMTPMailer {
    private $host;
    private $port;
    private $username;
    private $password;
    private $from_email;
    private $from_name;
    private $socket;
    private $errors = [];

    public function __construct($host, $port, $username, $password, $from_email, $from_name) {
        $this->host = $host;
        $this->port = $port;
        $this->username = $username;
        $this->password = $password;
        $this->from_email = $from_email;
        $this->from_name = $from_name;
    }

    /**
     * Send an email
     *
     * @param string $to Recipient email address
     * @param string $subject Email subject
     * @param string $html_body HTML email body
     * @param string $text_body Plain text email body (fallback)
     * @return bool Success status
     */
    public function send($to, $subject, $html_body, $text_body = '') {
        try {
            // Connect to SMTP server
            $this->connect();

            // Send SMTP commands
            $this->command("EHLO " . $this->host, 250);
            $this->command("AUTH LOGIN", 334);
            $this->command(base64_encode($this->username), 334);
            $this->command(base64_encode($this->password), 235);
            $this->command("MAIL FROM: <{$this->from_email}>", 250);
            $this->command("RCPT TO: <{$to}>", 250);
            $this->command("DATA", 354);

            // Build email message
            $message = $this->buildMessage($to, $subject, $html_body, $text_body);
            $this->command($message . "\r\n.", 250);

            // Close connection
            $this->command("QUIT", 221);
            fclose($this->socket);

            return true;
        } catch (Exception $e) {
            $this->errors[] = $e->getMessage();
            if (is_resource($this->socket)) {
                fclose($this->socket);
            }
            return false;
        }
    }

    /**
     * Connect to SMTP server
     */
    private function connect() {
        $this->socket = fsockopen($this->host, $this->port, $errno, $errstr, 10);

        if (!$this->socket) {
            throw new Exception("Failed to connect to SMTP server: $errstr ($errno)");
        }

        // Read server greeting
        $response = fgets($this->socket, 515);
        if (substr($response, 0, 3) != '220') {
            throw new Exception("SMTP server did not respond with 220: $response");
        }
    }

    /**
     * Send SMTP command and verify response
     */
    private function command($command, $expected_code) {
        fputs($this->socket, $command . "\r\n");
        $response = fgets($this->socket, 515);

        $code = substr($response, 0, 3);
        if ($code != $expected_code) {
            throw new Exception("SMTP command failed. Expected $expected_code, got $code: $response");
        }

        return $response;
    }

    /**
     * Build MIME email message
     */
    private function buildMessage($to, $subject, $html_body, $text_body) {
        $boundary = md5(uniqid(time()));

        // If no text body provided, strip HTML tags from html_body
        if (empty($text_body)) {
            $text_body = strip_tags($html_body);
        }

        $headers = [
            "From: {$this->from_name} <{$this->from_email}>",
            "To: {$to}",
            "Subject: {$subject}",
            "MIME-Version: 1.0",
            "Content-Type: multipart/alternative; boundary=\"{$boundary}\"",
            "X-Mailer: PHP/" . phpversion()
        ];

        $message = implode("\r\n", $headers) . "\r\n\r\n";

        // Plain text part
        $message .= "--{$boundary}\r\n";
        $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
        $message .= $text_body . "\r\n\r\n";

        // HTML part
        $message .= "--{$boundary}\r\n";
        $message .= "Content-Type: text/html; charset=UTF-8\r\n";
        $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
        $message .= $html_body . "\r\n\r\n";

        // End boundary
        $message .= "--{$boundary}--";

        return $message;
    }

    /**
     * Get error messages
     */
    public function getErrors() {
        return $this->errors;
    }
}

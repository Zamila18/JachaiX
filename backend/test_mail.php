<?php
// Run via: docker exec jachaix-app-1 php artisan eval "$(cat test_mail.php)"
// Actually run via tinker file mode

use Illuminate\Support\Facades\Mail;

Mail::raw('Test email from JachaiX contact form.', function ($m) {
    $m->to('musketeerst687175@gmail.com')->subject('JachaiX Test Email');
});

echo "Mail sent successfully!\n";

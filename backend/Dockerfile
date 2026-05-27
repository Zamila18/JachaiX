FROM php:8.3-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    supervisor

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy project files
COPY . .

# Install Laravel dependencies
RUN composer install --optimize-autoloader --no-interaction --prefer-dist

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && mkdir -p /var/log/supervisor /var/log/php-fpm

# PHP-FPM pool config (more workers, slow-log)
RUN printf '[www]\nuser = www-data\ngroup = www-data\nlisten = 9000\npm = dynamic\npm.max_children = 10\npm.start_servers = 3\npm.min_spare_servers = 2\npm.max_spare_servers = 6\npm.max_requests = 500\n' \
    > /usr/local/etc/php-fpm.d/www.conf

# Supervisord config: php-fpm + 1 queue worker (only 1 to avoid Ollama congestion)
RUN printf '[supervisord]\nnodaemon=true\nuser=root\nlogfile=/var/log/supervisor/supervisord.log\n\n[program:php-fpm]\ncommand=php-fpm --nodaemonize\nautostart=true\nautorestart=true\npriority=10\nstdout_logfile=/dev/stdout\nstdout_logfile_maxbytes=0\nstderr_logfile=/dev/stderr\nstderr_logfile_maxbytes=0\n\n[program:queue-worker]\ncommand=php /var/www/html/artisan queue:work --sleep=3 --tries=1 --timeout=240 --max-time=3600\ndirectory=/var/www/html\nautostart=true\nautorestart=true\npriority=20\nstartretries=5\nuser=www-data\nstdout_logfile=/var/www/html/storage/logs/worker.log\nstdout_logfile_maxbytes=10MB\nstderr_logfile=/var/www/html/storage/logs/worker-error.log\nstderr_logfile_maxbytes=10MB\n' \
    > /etc/supervisor/conf.d/jachaix.conf

EXPOSE 9000
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/jachaix.conf"]
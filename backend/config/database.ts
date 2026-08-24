export default ({ env }) => ({
  connection: {
    client: env('DATABASE_CLIENT', 'postgres'),
    connection: {
      host: env('DATABASE_HOST', '127.0.0.1'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'vinyl_backoffice'),
      user: env('DATABASE_USERNAME', 'vinyl'),
      password: env('DATABASE_PASSWORD', 'vinyl'),
      ssl: env.bool('DATABASE_SSL', false) && {
        rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
      },
      schema: env('DATABASE_SCHEMA', 'public'),
    },
    pool: { min: 0, max: 10 },
  },
});

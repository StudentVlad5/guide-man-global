/** @type {import('next').NextConfig} */

const { i18n } = require('./next-i18next.config');
const path = require('path');

const nextConfig = {
	images: {
		remotePatterns: [
		  {
			protocol: 'https',
			hostname: 'firebasestorage.googleapis.com',
			port: '',
			pathname: '/**',
		  },
		],
	  },
	sassOptions: {
		includePaths: [path.join(__dirname, 'styles')],
	  },
	webpack: (config) => {
		config.resolve.fallback = { fs: false };
		config.module.rules.push({
			loader: '@svgr/webpack',
			issuer: /\.[jt]sx?$/,
			options: {
				prettier: false,
				svgo: true,
				svgoConfig: {
					plugins: [{
						name: 'preset-default',
						params: {
							override: {
								removeViewBox: false
							}
						}
					}],
				},
				titleProp: true,
			},
			test: /\.svg$/,
		});
  
	
		return config;
	  },

	  reactStrictMode: true,
	swcMinify: true,
	i18n,
}

module.exports = nextConfig
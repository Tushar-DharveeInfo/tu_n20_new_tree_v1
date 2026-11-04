#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

function parseEnv(content) {
  const values = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    values[key] = rawValue.replace(/^"|"$/g, '');
  }

  return values;
}

const root = process.cwd();
const envPath = join(root, '.env');
const envProductionPath = join(root, '.env.production');
const envMasterPath = join(root, 'env-master');

// Ensure env-master exists
if (!existsSync(envMasterPath)) {
  console.error('Error: env-master not found in project root');
  process.exit(1);
}

// Always sync both .env and .env.production from env-master
copyFileSync(envMasterPath, envPath);
copyFileSync(envMasterPath, envProductionPath);
console.log('✓ Synced .env and .env.production from env-master');

// Check for --env <file> argument to determine which config to use
const envArgIndex = process.argv.indexOf('--env');
const envOverride = envArgIndex !== -1 ? process.argv[envArgIndex + 1] : null;

let envValues;
if (envOverride) {
  const envOverridePath = join(root, envOverride);
  if (!existsSync(envOverridePath)) {
    console.error(`Error: ${envOverride} not found in project root`);
    process.exit(1);
  }
  envValues = parseEnv(readFileSync(envOverridePath, 'utf8'));
  console.log(`✓ Using ${envOverride} for config generation`);
} else {
  envValues = parseEnv(readFileSync(envPath, 'utf8'));
}

const authType = envValues.VITE_AUTH_TYPE ?? 'basic';
const tenantNickname = envValues.VITE_TENANT_NICKNAME ?? 'netzoom-uhjpe';
const tenantDisplayName = envValues.VITE_TENANT_DISPLAY_NAME ?? 'NetZoom';
const apiAt = envValues.VITE_API_AT ?? 'n20api';
const nodeEnv = envValues.VITE_NODE_ENV ?? 'development';
const deployment = envValues.DEPLOYMENT_DEPLOYMENT ?? 'OnPremises';
const dateInstalled = envValues.DEPLOYMENT_DATE_INSTALLED ?? '';
const dateLastUpdated = envValues.DEPLOYMENT_DATE_LASTUPDATED ?? '';

const configJsContent = [
  'window.appSettings = {',
  `  TENANT_NICKNAME: '${tenantNickname}',`,
  `  TENANT_DISPLAY_NAME: '${tenantDisplayName}',`,
  `  AUTH_TYPE: '${authType}',`,
  `  API_AT: '${apiAt}',`,
  `  NODE_ENV: '${nodeEnv}',`,
  `  BASIC_AUTH_ENDPOINT: '${envValues.VITE_BASIC_AUTH_ENDPOINT ?? '/api/login.aspx'}',`,
  `  NETZOOM_AUTH_ENDPOINT: '${envValues.VITE_NETZOOM_AUTH_ENDPOINT ?? '/api/login.aspx'}',`,
  `  DEPLOYMENT: '${deployment}',`,
  `  DATE_INSTALLED: '${dateInstalled}',`,
  `  DATE_LASTUPDATED: '${dateLastUpdated}',`,
  `  DEPLOYMENT_N20_API_URL: '${envValues.DEPLOYMENT_N20_API_URL ?? ''}',`,
  `  DEPLOYMENT_N20_API_BASEURL: '${envValues.DEPLOYMENT_N20_API_BASEURL ?? ''}',`,
  `  DEPLOYMENT_DCMLISTENER_API_URL: '${envValues.DEPLOYMENT_DCMLISTENER_API_URL ?? ''}',`,
  `  DEPLOYMENT_EXPSERVER_API_URL: '${envValues.DEPLOYMENT_EXPSERVER_API_URL ?? ''}',`,
  `  DEPLOYMENT_NZINTHUB_API_URL: '${envValues.DEPLOYMENT_NZINTHUB_API_URL ?? ''}',`,
  `  DEPLOYMENT_DATE_INSTALLED: '${envValues.DEPLOYMENT_DATE_INSTALLED ?? ''}',`,
  `  DEPLOYMENT_DATE_LASTUPDATED: '${envValues.DEPLOYMENT_DATE_LASTUPDATED ?? ''}',`,
  `  FIREBASE_API_KEY: '${envValues.VITE_FIREBASE_API_KEY ?? ''}',`,
  `  FIREBASE_AUTH_DOMAIN: '${envValues.VITE_FIREBASE_AUTH_DOMAIN ?? ''}',`,
  `  FIREBASE_PROJECT_ID: '${envValues.VITE_FIREBASE_PROJECT_ID ?? ''}',`,
  `  FIREBASE_APP_ID: '${envValues.VITE_FIREBASE_APP_ID ?? ''}',`,
  '};',
  '',
  'window.APP_CONFIG = window.appSettings;'
].join('\n');

writeFileSync(join(root, 'public', 'config.js'), configJsContent);

// Update web.config with appSettings from .env
const webConfigPath = join(root, 'public', 'web.config');
const webConfigContent = readFileSync(webConfigPath, 'utf8');

// Define all app settings that should be synced
const appSettings = {
  'AUTH_TYPE': authType,
  'TENANT_NICKNAME': tenantNickname,
  'TENANT_DISPLAY_NAME': tenantDisplayName,
  'API_AT': apiAt,
  'NODE_ENV': 'production', // Always production for web.config
  'BASIC_AUTH_ENDPOINT': envValues.VITE_BASIC_AUTH_ENDPOINT ?? '/api/login.aspx',
  'NETZOOM_AUTH_ENDPOINT': envValues.VITE_NETZOOM_AUTH_ENDPOINT ?? '/api/login.aspx',
  'DEPLOYMENT': deployment,
  'DATE_INSTALLED': dateInstalled,
  'DATE_LASTUPDATED': dateLastUpdated,
  'DEPLOYMENT_N20_API_URL': envValues.DEPLOYMENT_N20_API_URL ?? '',
  'DEPLOYMENT_N20_API_BASEURL': envValues.DEPLOYMENT_N20_API_BASEURL ?? '',
  'DEPLOYMENT_DCMLISTENER_API_URL': envValues.DEPLOYMENT_DCMLISTENER_API_URL ?? '',
  'DEPLOYMENT_EXPSERVER_API_URL': envValues.DEPLOYMENT_EXPSERVER_API_URL ?? '',
  'DEPLOYMENT_NZINTHUB_API_URL': envValues.DEPLOYMENT_NZINTHUB_API_URL ?? '',
  'FIREBASE_API_KEY': envValues.VITE_FIREBASE_API_KEY ?? '',
  'FIREBASE_AUTH_DOMAIN': envValues.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  'FIREBASE_PROJECT_ID': envValues.VITE_FIREBASE_PROJECT_ID ?? '',
  'FIREBASE_APP_ID': envValues.VITE_FIREBASE_APP_ID ?? ''
};

// Update web.config appSettings section without touching rewrite rules
let updatedWebConfig = updateWebConfigAppSettings(webConfigContent, appSettings);

writeFileSync(webConfigPath, updatedWebConfig);
console.log('✓ Synced public/config.js and public/web.config from .env');

/**
 * Updates the appSettings section in web.config, adding missing keys and updating existing ones
 * Preserves all other sections including rewrite rules
 */
function updateWebConfigAppSettings(xmlContent, settings) {
  // Extract the appSettings section
  const appSettingsStart = xmlContent.indexOf('<appSettings>');
  const appSettingsEnd = xmlContent.indexOf('</appSettings>');

  if (appSettingsStart === -1 || appSettingsEnd === -1) {
    console.error('Error: Could not find <appSettings> section in web.config');
    return xmlContent;
  }

  // Parse existing settings
  const existingSettings = new Map();
  const appSettingsSection = xmlContent.substring(appSettingsStart, appSettingsEnd + 14);
  const addKeyRegex = /<add key="([^"]+)" value="[^"]*" \/>/g;
  let match;

  while ((match = addKeyRegex.exec(appSettingsSection)) !== null) {
    existingSettings.set(match[1], true);
  }

  // Build new appSettings content
  let newAppSettings = '<appSettings>\n';

  for (const [key, value] of Object.entries(settings)) {
    // Escape XML special characters in value
    const escapedValue = String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    newAppSettings += `    <add key="${key}" value="${escapedValue}" />\n`;
  }

  newAppSettings += '  </appSettings>';

  // Replace only the appSettings section, preserving everything else
  const before = xmlContent.substring(0, appSettingsStart);
  const after = xmlContent.substring(appSettingsEnd + 14);

  return before + newAppSettings + after;
}

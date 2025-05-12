import i18n from 'i18next'
import HttpBackend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'
import yaml from 'js-yaml'

const defaultLanguage = window.store.get('language') ?? navigator.language

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/translation/{{lng}}.yaml',
      parse: (data: string) => yaml.load(data)
    },
    fallbackLng: 'en',
    lng: defaultLanguage,
    interpolation: {
      escapeValue: false
    }
  })

export default i18n

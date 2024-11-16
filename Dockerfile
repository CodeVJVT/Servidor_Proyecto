# Usa una imagen de Node.js oficial como base
FROM node:14

# Crea un directorio de trabajo
WORKDIR /usr/src/app

# Copia el archivo de código del usuario dentro del contenedor
COPY ./temp/userCode.js .

# Comando para ejecutar el código del usuario
CMD ["node", "userCode.js"]
#!/bin/sh
# Maven Wrapper startup script for Unix-like systems

set -e

MAVEN_WRAPPER_JAR=".mvn/wrapper/maven-wrapper.jar"
MAVEN_WRAPPER_PROPERTIES=".mvn/wrapper/maven-wrapper.properties"
DOWNLOAD_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"

# If wrapper jar missing, try to download it
if [ ! -f "$MAVEN_WRAPPER_JAR" ]; then
    echo "Downloading Maven Wrapper..."
    if command -v curl > /dev/null 2>&1; then
        curl -sL "$DOWNLOAD_URL" -o "$MAVEN_WRAPPER_JAR"
    elif command -v wget > /dev/null 2>&1; then
        wget -q "$DOWNLOAD_URL" -O "$MAVEN_WRAPPER_JAR"
    else
        echo "Neither curl nor wget found. Please install Maven manually."
        exit 1
    fi
fi

# If JAVA_HOME not set, try to find Java
if [ -z "$JAVA_HOME" ]; then
    if command -v java > /dev/null 2>&1; then
        JAVA_CMD="java"
    else
        echo "Java not found. Please install Java 17+."
        exit 1
    fi
else
    JAVA_CMD="$JAVA_HOME/bin/java"
fi

exec "$JAVA_CMD" -jar "$MAVEN_WRAPPER_JAR" "$@"

@REM Maven Wrapper startup script for Windows

@IF "%JAVA_HOME%" == "" (
    SET JAVA_CMD=java
) ELSE (
    SET JAVA_CMD=%JAVA_HOME%\bin\java.exe
)

SET MAVEN_WRAPPER_JAR=.mvn\wrapper\maven-wrapper.jar
SET DOWNLOAD_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar

IF NOT EXIST "%MAVEN_WRAPPER_JAR%" (
    echo Downloading Maven Wrapper...
    powershell -Command "Invoke-WebRequest '%DOWNLOAD_URL%' -OutFile '%MAVEN_WRAPPER_JAR%'"
)

%JAVA_CMD% -jar %MAVEN_WRAPPER_JAR% %*

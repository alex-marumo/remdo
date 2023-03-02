#!/bin/zsh

SCRIPT_PATH=$0

function debug {
    #launches this script in watch mode and auto executes test function on every change
    $SCRIPT_PATH test
    SHELL=zsh npx chokidar $SCRIPT_PATH -c "$SCRIPT_PATH test"
}

function repo_files {
    #list files in thi git reporitory includes nedwly added and not commited yet
    #but does not include submodules, neither ignored files
    NEW_FILES=$(git ls-files --others --exclude-standard)
    TRACKED_FILES=$(git ls-files)
    if [ "$1" = "include_submodules" ]; then
        echo $NEW_FILES $TRACKED_FILES
    else
        SUBMODULES_REGEXP=$(git submodule foreach --quiet 'echo ^$path' | tr '\n' '|' | sed 's/|$//')
        echo $NEW_FILES $TRACKED_FILES | grep -Ev $SUBMODULES_REGEXP
    fi
}

function watch_repo {
    #exclude data/ dir as symlink placed there causes firing commant twice
    SHELL=zsh npx chokidar $(repo_files include_submodules | grep -Ev '^data/') -c $1
}

#test function, modify it as you like
function test {
    clear
    echo "testing"
}

function wrong_usage {
    echo "Usage: $SCRIPT_PATH [function], where function is one of:"
    egrep "^function" $SCRIPT_PATH | grep -v wrong_usage | awk '{print " "$2}'
    exit 1
}

function trim_playwright {
    #removes some unnecessary lines from the end of the playwright output
    cat | grep -Ev 'To open last HTML report run|npx playwright show-report data'
}

if [ "$#" -eq 0 ]; then
    wrong_usage
fi

#launch command provided as the first argument and pass all remaining arguments
$1 "${@:2}"

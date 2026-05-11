*** Settings ***
Library    SeleniumLibrary
Suite Setup    Open Portfolio
Suite Teardown    Close Browser

*** Variables ***
${BASE_URL}    http://127.0.0.1:4177
${BROWSER}     Chrome

*** Keywords ***
Open Portfolio
    ${options}=    Evaluate    selenium.webdriver.ChromeOptions()    modules=selenium.webdriver
    Call Method    ${options}    add_argument    --headless\=new
    Call Method    ${options}    add_argument    --disable-gpu
    Call Method    ${options}    add_argument    --window-size\=390,844
    Open Browser    ${BASE_URL}    ${BROWSER}    options=${options}
    Set Selenium Timeout    8 seconds

Page Should Not Overflow Horizontally
    ${overflow}=    Execute Javascript    return Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, document.body.scrollWidth - document.body.clientWidth)
    Should Be True    ${overflow} <= 1

*** Test Cases ***
Hero And Navigation Are Visible On Mobile
    Title Should Be    Douglas Antonio | Software Quality Engineer
    Page Should Contain Element    css:h1
    Page Should Contain    Engenharia de Qualidade Escalável
    Page Should Contain Link    Open Source
    Page Should Not Overflow Horizontally

Projects And Volunteer Cards Render
    ${main_count}=    Get Element Count    css:#projects-container article
    ${volunteer_count}=    Get Element Count    css:#volunteer-container article
    ${trigger_count}=    Get Element Count    css:.trigger-modal
    Should Be Equal As Integers    ${main_count}    4
    Should Be Equal As Integers    ${volunteer_count}    1
    Should Be Equal As Integers    ${trigger_count}    5

Project Modal Opens And Closes
    Execute Javascript    document.querySelector('.trigger-modal').scrollIntoView({ block: 'center', inline: 'center' })
    Execute Javascript    document.querySelector('.trigger-modal').click()
    Wait Until Element Is Visible    css:.glass-modal.active
    Page Should Contain    Automação de Performance com K6
    Press Keys    None    ESC
    Wait Until Element Is Not Visible    css:.glass-modal.active

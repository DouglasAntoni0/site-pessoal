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
    Page Should Contain    Qualidade que antecipa riscos
    Page Should Contain Link    Open Source
    Page Should Not Overflow Horizontally

Skills And Icons Match Resume
    ${group_count}=    Get Element Count    css:[data-skill-group]
    ${skill_count}=    Get Element Count    css:.skill-chip
    ${icon_count}=    Get Element Count    css:.skill-chip svg use
    Should Be Equal As Integers    ${group_count}    6
    Should Be Equal As Integers    ${skill_count}    62
    Should Be Equal As Integers    ${icon_count}    62
    Page Should Contain    Appium Inspector

Projects And Volunteer Cards Render
    ${main_count}=    Get Element Count    css:#projects-container article
    ${volunteer_count}=    Get Element Count    css:#volunteer-container article
    ${trigger_count}=    Get Element Count    css:.trigger-modal
    Should Be Equal As Integers    ${main_count}    9
    Should Be Equal As Integers    ${volunteer_count}    1
    Should Be Equal As Integers    ${trigger_count}    10
    Page Should Contain    Pytest: Gerenciador de Tarefas
    Page Should Contain    Selenium JS Toolshop QA
    Page Should Contain    BDD com Cucumber

Project Modal Opens And Closes
    Execute Javascript    document.querySelector('.trigger-modal').scrollIntoView({ block: 'center', inline: 'center' })
    Execute Javascript    document.querySelector('.trigger-modal').click()
    Wait Until Element Is Visible    css:.glass-modal.active
    Page Should Contain    Automação de Performance com K6
    Press Keys    None    ESC
    Wait Until Element Is Not Visible    css:.glass-modal.active

Certifications Section Renders
    Execute Javascript    document.querySelector('#certifications').scrollIntoView({ block: 'center', inline: 'center' })
    Page Should Contain    Certificações que sustentam
    ${cert_count}=    Get Element Count    css:#certifications .certification-card
    Should Be Equal As Integers    ${cert_count}    14
    ${cert_button_count}=    Get Element Count    css:#certifications .certification-view-btn
    Should Be Equal As Integers    ${cert_button_count}    14
    ${support_count}=    Get Element Count    css:#certifications .certification-support-card
    Should Be Equal As Integers    ${support_count}    2
    Page Should Contain    Segurança em Tecnologia da Informação
    Page Should Contain    Projetos de Sistemas de TI
    Page Should Contain    Testando com Inteligência (Artificial)
    Page Should Contain    Inglês técnico — formação e uso atual
    Page Should Contain    Leitura: intermediária
    Page Should Contain    Conversação: básico-intermediária
    Page Should Contain    Informática
    Execute Javascript    document.querySelector('#certifications .certification-view-btn').click()
    Wait Until Element Is Visible    css:#certificate-viewer-modal.active
    ${certificate_src}=    Get Element Attribute    css:#certificate-modal-image    src
    Should Contain    ${certificate_src}    assets/certificates/previews/ebac-engenheiro-qualidade-software.webp
    Press Keys    None    ESC
    Wait Until Element Is Not Visible    css:#certificate-viewer-modal.active
    Page Should Contain    Playwright Zombie Edition
    ${href}=    Get Element Attribute    css:#certifications .certifications-cta    href
    Should Contain    ${href}    linkedin.com/in/douglas-antonio-qa/details/certifications
    Page Should Not Overflow Horizontally

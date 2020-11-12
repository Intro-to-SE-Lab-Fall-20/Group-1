from selenium import webdriver
from selenium.webdriver.common.keys import Keys
import time

# NOTE: Currently works with the Test Manager's setup
# TODO: Adjust this to fine chromedriver.exe locally
driver = webdriver.Chrome("C:/Users/DMent/Desktop/Group-1/Selenium/chromedriver.exe")
driver.get("http://localhost:3000/")

# Assert that "EC Email Client" is in the title

assert "EC Email Client" in driver.title
print("[SUCCESS] - Correct Title Detected")

time.sleep(2)

usernameElement = driver.find_element_by_xpath("//input[@type='username']")
usernameElement.send_keys('BobbyHill')

passwordElement = driver.find_element_by_xpath("//input[@type='password']")
passwordElement.send_keys('asdfasdf')

driver.find_element_by_xpath('//button[contains(text(), "Login")]').click()

print("[SUCCESS] - Master Login Page")

time.sleep(3)

driver.find_element_by_xpath('//button[contains(text(), "EC > Gmail")]').click()
print("[SUCCESS] - Correct EC Email Client Button Selector Detected")

time.sleep(5)

# NOTE: In-depth EC Email Client Application Testing will not be included in this
#       script because of Google's anti selenium security
if driver.find_element_by_class_name('GoogleSigninButton'):
    print("[SUCCESS] Google Sign In Button Detected")
else:
    print("[FAIL] Google Sign In Button Not Detected")

driver.find_element_by_xpath('//button[contains(text(), "Back To App Selection")]').click()
print("[SUCCESS] Returned to App Selector From EC Email Client Login")

driver.find_element_by_xpath('//button[contains(text(), "I love notes!")]').click()

print("[SUCCESS] Navigation to notes page")

driver.find_element_by_xpath('//button[contains(text(), "Compose Note")]')

print("[SUCCESS] Compose Note Button Available")

driver.find_element_by_xpath('//button[contains(text(), "Back To App Selection")]').click()
driver.find_element_by_xpath('//button[contains(text(), "Master Sign Out")]').click()

print("\n")
print("GUI Navigation Testing Complete. \nIf you see this message then the application successfully functions up to the predetermined standards!")



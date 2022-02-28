Feature: Test cases for common elements and functionalities

  Scenario Outline: Searching for an address
    Given User has opened the "landing" page
    And User clicks on the header search bar
    And User searches for static balance account
    And User opens the "<network>" account result
    Then The account page on "<network>" is opened
    Examples:
      | network          |
      | matic            |
      | xdai             |
#      | arbitrum-rinkeby |
#      | avalanche-fuji   |
#      | goerli           |
#      | kovan            |
#      | mumbai           |
#      | optimism-kovan   |
#      | rinkeby          |
#      | ropsten          |

  Scenario Outline: Searching for a listed token
    Given User has opened the "landing" page
    And User clicks on the header search bar
    And User searches for "USDCx"
    And User opens the first token result on "<network>"
    Then The token page on "<network>" is opened
    And Token listed status is "Yes"
    Examples:
      | network          |
      | matic            |
      | xdai             |
#      | arbitrum-rinkeby |
#      | avalanche-fuji   |
#      | goerli           |
#      | kovan            |
#      | mumbai           |
#      | optimism-kovan   |
#      | rinkeby          |
#      | ropsten          |

  Scenario Outline: Adding an account to address book and searching for it
    Given User has opened the "static balance account" page on "xdai"
    And User clicks the address book button
    And User saves the entry as "<entry>"
    And Address book button is filled
    And User clicks on the header search bar
    Then Address book entry named "<entry>" is shown
    And User searches for "<entry>"
    And Account search result entry named "<entry>" is shown
    Examples:
      | entry           |
      | testingtesting  |
      | TestingWithUpperCase|
      | Testing With Spaces |
      | Testing With 123!@£ |

    Scenario: Opening subgraph page
      Given User has opened the "landing" page
      And User clicks on the subgraph explorer button
      Then Subgraph explorer page is opened

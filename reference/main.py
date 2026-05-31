import csv
from housinganalysis import HousingAnalysis
from mortgage import Mortgage 
from rent import Renter

# Inital home loan parameters
interest_rate = 6.722
purchase_price = 400000
down_payment = 20 # Precentage of the home purchase price brought to closing
loan_length = 30 # years, Term length ofhte loan
real_estate_rax_rate = 1.2 #precentage of purchase price or assessed home value
private_mortgage_insurance_rate = 0.0 # Precentage of home loan
homeowner_insurance = 1500 # USD, This is the annual amount owed to the insurance company
hoa_fee = 0 # USD, The mothly HOA payment 
assessed_value = 0 # The book vlaue of the home according to the state it resides in
closing_costs = 0.05 # Estimated closing costs 
home_size = 2000 # Home size in square footage; used for estimating monthly utilities 

# Additional Homebuying Costs
closingcosts = purchase_price * closing_costs # The 0.05 will be an entry given by the user
utilities = home_size*0.25 # Estimated utilities = Home Size times $0.25 per square foot
maintenance = 0.05 * purchase_price / 12 # Monthly maintenance costs based on home purchase price

# Inital renter parameters, all values are in USD
base_rent = 2000
pet_rent = 0 
parking_fee = 0 
renters_insurance = 8
admin_fee = 0
security_deposit = 2000
pet_deposit = 50 # Pet deposit amount is usually per pet, so $XX.XX per animal

# Year Appreication and Cost Increase Rates
homevalueincrease = 0.04
utilitiesincrease = 0.06
hoaincrease = 0.05
rent_increase = 0.05
maintenanceincrease = homevalueincrease
insuranceincrease = utilitiesincrease

# Mortage Calculation
mortgage = Mortgage(interest_rate, purchase_price, down_payment, 
                    loan_length, real_estate_rax_rate, private_mortgage_insurance_rate, 
                    homeowner_insurance, hoa_fee, assessed_value)
renter = Renter(base_rent, pet_rent, parking_fee, renters_insurance, admin_fee, security_deposit, pet_deposit)

# Calculate mortgage payment, amotorization and loan
mortgagepayment, amortization, loan = mortgage.mortgagepayment()

# Calculate rent payment and upfront costs
rent_payment, upfront_costs = renter.rentpayment()

# Run monthly and yearly housing analyses
analysis = HousingAnalysis(mortgage, loan, closingcosts, maintenance, homevalueincrease,
                           hoaincrease, maintenanceincrease, renter, rent_payment, upfront_costs,
                           rent_increase, utilities, utilitiesincrease, insuranceincrease)

# Combined schedule of payments plus increasing ownership costs
schedule = [{**row1 , **row2, **row3 }for row1, row2, row3 in zip(amortization,
                                                                  analysis.ownership_phantomcosts(),
                                                                  analysis.rental_phantomcosts())]

# Export schedule to CSV file. Use the first row to determine column order.
if schedule:
    fieldnames = list(schedule[0].keys()) # Get field names from the first row
    with open('schedule.csv', 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader() #
        for row in schedule:
            writer.writerow(row)
    print("Wrote schedule to schedule.csv")
else:
    print("No schedule data to write")


# Housing Statistics
totalcostofonwership = analysis.totalcostofownership(schedule)

# Opening message with a summary of results and which option is more cost effective
print("\n")
print("Housing Analysis Results")
print("------------------------")
print("\n")

# Print Total Cost of Home Ownership
print("Total Costs of Homeownership: \n")
print(f"Monthly Payment: ${mortgagepayment:,.2f}")
print(f"Total Principal: ${totalcostofonwership[0]['Total Principal']:,.2f}")
print(f"Total Interest Paid: ${totalcostofonwership[0]['Total Interest']:,.2f}")
print(f"Total PMI: ${totalcostofonwership[0]['Total PMI']:,.2f}")
print(f"Total HOA Dues: ${totalcostofonwership[0]['Total HOA Dues']:,.2f}")
print(f"Total Real Estate Taxes: ${totalcostofonwership[0]['Total Real Estate Taxes']:,.2f}")
print(f"Total Insuarnce: ${totalcostofonwership[0]['Total Insurance']:,.2f}")
print(f"Total Home Maintenance: ${totalcostofonwership[0]['Total Home Maintenance']:,.2f}")
print(f"Total Utilities: ${totalcostofonwership[0]['Total Utilities']:,.2f}")
print(f"Total Cost of Ownership: ${totalcostofonwership[0]['Total Cost of Home Ownership']:,.2f}")
print(f"Total Equity Gained: ${totalcostofonwership[0]['Total Equity in the Home']:,.2f}")

print("\n")
print("\n")

# Print Total Cost of Rentership
print("Total Costs of Rentership: \n")
print(f"Starting Rent Payment: ${rent_payment:,.2f}")
print(f"Total Base Rent: ${totalcostofonwership[0]['Total Rent']:,.2f}")
print(f"Total Renter's Insurance: ${totalcostofonwership[0]['Total Renters Insurance']:,.2f}")
print(f"Total Pet Fees: ${totalcostofonwership[0]['Total Pet Fees']:,.2f}")
print(f"Total Parking Fees: ${totalcostofonwership[0]['Total Parking Fees']:,.2f}")
print(f"Total Utilities: ${totalcostofonwership[0]['Total Utilities']:,.2f}")
print(f"Total Cost of Ownership: ${totalcostofonwership[0]['Total Cost of Rentership']:,.2f}")
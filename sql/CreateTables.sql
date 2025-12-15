use BudgetApp
go

create table Tags
(
    TagId        int identity primary key,
    UserId       nvarchar(100)  not null,
    ParentTagId  int null
        constraint FK_Tags_ParentTag
            references Tags(TagId),
    TagName      nvarchar(255)  not null,
    BudgetAmount decimal(18, 2) not null,

    TagType      int not null
        constraint CK_Tags_TagType
            check (TagType in (1, 2))
)
go

create table Transactions
(
    TransactionId   int identity primary key,
    UserId          nvarchar(100)            not null,
    Date            date                     not null,
    Amount          decimal(18, 2)           not null,
    MerchantDetails nvarchar(500) default '' not null,
    TagId           int null
        constraint FK_Transactions_Tags
            references Tags(TagId)
)
go